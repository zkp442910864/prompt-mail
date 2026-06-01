import { ImapFlow, type FetchMessageObject, type MailboxObject } from 'imapflow'
import type { EmailConfig, MailSummary, MailDetail } from '../types/index.js'
import { parseMimeSource, extractAttachments } from './mailParserService.js'

/** 创建 IMAP 客户端 */
function createImapClient(config: EmailConfig): ImapFlow {
  return new ImapFlow({
    host: config.imapHost,
    port: Number(config.imapPort),
    secure: true,
    auth: {
      user: config.account,
      pass: config.authCode,
    },
    logger: false as unknown as undefined,
  })
}

/** 测试 IMAP 连接 */
export async function testConnection(config: EmailConfig): Promise<boolean> {
  const client = createImapClient(config)
  try {
    await client.connect()
    return true
  } catch {
    return false
  } finally {
    try {
      await client.logout()
    } catch {
      // 忽略断开连接错误
    }
  }
}

/** 拉取邮件列表 */
export async function fetchMailList(
  config: EmailConfig,
  folder = 'INBOX',
  limit = 100,
  keyword?: string,
): Promise<MailSummary[]> {
  const client = createImapClient(config)
  let connected = false
  try {
    await client.connect()
    connected = true
    const lock = await client.getMailboxLock(folder)
    try {
      // 获取邮件总数
      const mailbox = client.mailbox as MailboxObject | false
      const exists = mailbox && typeof mailbox === 'object' ? mailbox.exists : 0
      if (!exists) return []

      // 关键词搜索：先尝试 IMAP SEARCH，失败则回退到拉取全量本地过滤
      if (keyword && keyword.trim()) {
        const kw = keyword.trim()
        const allUids = new Set<number>()

        // 尝试 IMAP SEARCH（标题 + 正文）
        const subjectResult = await client.search({ subject: kw }, { uid: true })
        if (subjectResult && subjectResult.length > 0) {
          subjectResult.forEach((uid) => allUids.add(uid))
        }

        const bodyResult = await client.search({ body: kw }, { uid: true })
        if (bodyResult && bodyResult.length > 0) {
          bodyResult.forEach((uid) => allUids.add(uid))
        }

        // IMAP SEARCH 无结果 → 回退：拉取全量邮件，本地过滤标题
        if (allUids.size === 0) {
          const fallbackMessages: MailSummary[] = []
          const seqAll = `${Math.max(1, exists - 500 + 1)}:*`
          for await (const msg of client.fetch(seqAll, {
            envelope: true, flags: true, bodyStructure: true,
          })) {
            const item = buildMailSummary(msg)
            if (item) fallbackMessages.push(item)
          }
          const lowerKw = kw.toLowerCase()
          const filtered = fallbackMessages.filter(
            (m) => m.subject.toLowerCase().includes(lowerKw),
          )
          filtered.sort((a, b) => {
            const d = new Date(b.date).getTime() - new Date(a.date).getTime()
            return d !== 0 ? d : Number(b.id) - Number(a.id)
          })
          return filtered.slice(0, limit)
        }

        // IMAP SEARCH 有结果：取最新的 limit 条
        const sortedUids = [...allUids].sort((a, b) => b - a)
        const matchedUids = sortedUids.slice(0, limit)

        // 批量 fetch 指定 UID 的邮件信封
        const messages: MailSummary[] = []
        for await (const msg of client.fetch(
          matchedUids.map((uid) => String(uid)),
          { envelope: true, flags: true, bodyStructure: true },
          { uid: true },
        )) {
          const item = buildMailSummary(msg)
          if (item) messages.push(item)
        }

        // 按日期降序
        messages.sort((a, b) => {
          const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
          if (dateDiff !== 0) return dateDiff
          return Number(b.id) - Number(a.id)
        })
        return messages
      }

      // 无关键词：从最新开始拉取
      const startSeq = Math.max(1, exists - limit + 1)
      const fetchRange = `${startSeq}:*`
      const messages: MailSummary[] = []

      for await (const msg of client.fetch(fetchRange, {
        envelope: true,
        flags: true,
        bodyStructure: true,
      })) {
        const item = buildMailSummary(msg)
        if (item) messages.push(item)
      }

      // 按日期降序排列（最新的在前）
      messages.sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
        if (dateDiff !== 0) return dateDiff
        return Number(b.id) - Number(a.id)
      })
      return messages
    } finally {
      lock.release()
    }
  } catch (err) {
    throw err
  } finally {
    if (connected) {
      try { await client.logout() } catch { /* 忽略 */ }
    }
  }
}

/** 从 fetch 消息对象构建 MailSummary */
function buildMailSummary(msg: FetchMessageObject): MailSummary | null {
  const envelope = msg.envelope
  if (!envelope) return null
  const from = envelope.from?.[0]
  const hasAttachments = checkHasAttachments(msg.bodyStructure)

  return {
    id: String(msg.uid),
    subject: envelope.subject || '(无主题)',
    from: {
      name: from?.name || '',
      address: from?.address || '',
    },
    date: envelope.date?.toISOString() || new Date().toISOString(),
    isRead: msg.flags?.has('\\Seen') ?? false,
    hasAttachments,
    snippet: envelope.subject || '',
  }
}

/** 检查 bodyStructure 是否包含附件 */
function checkHasAttachments(bs: unknown): boolean {
  if (!bs || typeof bs !== 'object') return false
  const body = bs as Record<string, unknown>
  if (body.type === 'multipart/mixed') return true
  if (Array.isArray(body.childNodes)) {
    return (body.childNodes as unknown[]).some(
      (child) => typeof child === 'object' && child !== null && checkHasAttachments(child),
    )
  }
  // 非 text/plain 和 text/html 的部分视为附件
  if (typeof body.type === 'string' && !body.type.startsWith('text/')) {
    return (body.disposition as string) === 'attachment'
  }
  return false
}

/** 拉取邮件详情（原始 MIME → 解析为结构化数据） */
export async function fetchMailDetail(
  config: EmailConfig,
  folder = 'INBOX',
  uid: string,
): Promise<MailDetail> {
  const client = createImapClient(config)
  let connected = false
  try {
    await client.connect()
    connected = true
    const lock = await client.getMailboxLock(folder)
    try {
      const message = await client.fetchOne(uid, { source: true }, { uid: true }) as FetchMessageObject
      if (!message.source) {
        throw new Error('邮件内容为空')
      }

      // 将 source (Buffer) 解析为结构化数据
      const source = Buffer.isBuffer(message.source)
        ? message.source
        : Buffer.from(message.source as unknown as Uint8Array)
      const parsed = await parseMimeSource(source)
      const attachments = extractAttachments(parsed, uid)

      const envelope = message.envelope
      const from = envelope?.from?.[0]

      // 从 mailparser 的 AddressObject 中提取地址列表
      const getAddressList = (addr: unknown): Array<{ name?: string; address?: string }> => {
        if (!addr) return []
        if (Array.isArray(addr)) return addr.flatMap((a) => a.value || [])
        if (typeof addr === 'object' && 'value' in addr) return (addr as { value: Array<{ name?: string; address?: string }> }).value || []
        return []
      }

      const fromAddr = getAddressList(parsed.from)[0]

      return {
        id: uid,
        subject: envelope?.subject || parsed.subject || '(无主题)',
        from: {
          name: from?.name || fromAddr?.name || '',
          address: from?.address || fromAddr?.address || '',
        },
        to: getAddressList(parsed.to).map((a) => ({
          name: a.name || '',
          address: a.address || '',
        })),
        cc: getAddressList(parsed.cc).map((a) => ({
          name: a.name || '',
          address: a.address || '',
        })),
        replyTo: getAddressList(parsed.replyTo).map((a) => ({
          name: a.name || '',
          address: a.address || '',
        })),
        date: envelope?.date?.toISOString() || parsed.date?.toISOString() || new Date().toISOString(),
        messageId: parsed.messageId || '',
        text: parsed.text || '',
        html: parsed.html || parsed.textAsHtml || '',
        attachments,
      }
    } finally {
      lock.release()
    }
  } catch (err) {
    throw err
  } finally {
    if (connected) {
      try { await client.logout() } catch { /* 忽略 */ }
    }
  }
}

/** 标记邮件已读 */
export async function markAsRead(
  config: EmailConfig,
  folder = 'INBOX',
  uid: string,
): Promise<void> {
  const client = createImapClient(config)
  let connected = false
  try {
    await client.connect()
    connected = true
    const lock = await client.getMailboxLock(folder)
    try {
      await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true })
    } finally {
      lock.release()
    }
  } catch (err) {
    throw err
  } finally {
    if (connected) {
      try { await client.logout() } catch { /* 忽略 */ }
    }
  }
}

/** 拉取附件二进制数据 */
export async function fetchAttachment(
  config: EmailConfig,
  folder: string,
  uid: string,
  partNumber: string,
): Promise<Buffer> {
  const client = createImapClient(config)
  let connected = false
  try {
    await client.connect()
    connected = true
    const lock = await client.getMailboxLock(folder)
    try {
      const message = await client.fetchOne(
        uid,
        { [`bodyPart.${partNumber}`]: true },
        { uid: true },
      ) as FetchMessageObject
      const bodyPart = message.bodyParts?.get(partNumber)
      if (!bodyPart) {
        throw new Error(`附件部分 ${partNumber} 不存在`)
      }
      return Buffer.isBuffer(bodyPart) ? bodyPart : Buffer.from(bodyPart as unknown as Uint8Array)
    } finally {
      lock.release()
    }
  } catch (err) {
    throw err
  } finally {
    if (connected) {
      try { await client.logout() } catch { /* 忽略 */ }
    }
  }
}
