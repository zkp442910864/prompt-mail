import type { Request, Response } from 'express'
import * as emailConfigStore from '../stores/emailConfigStore.js'
import * as imapService from '../services/imapService.js'
import * as smtpService from '../services/smtpService.js'
import { success, fail, error } from '../utils/response.js'

/** 获取参数中的字符串值（兼容 Express 5 query/params 类型） */
function getStr(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return undefined
}

/** 获取邮件列表 */
export async function getMailList(req: Request, res: Response) {
  const emailConfigId = getStr(req.query.emailConfigId)
  const folder = getStr(req.query.folder) || 'INBOX'
  const filter = getStr(req.query.filter) || 'all'
  const limit = Number(getStr(req.query.limit)) || 100

  if (!emailConfigId) {
    fail(res, '参数校验失败：emailConfigId 不能为空', 400)
    return
  }

  const config = emailConfigStore.getById(emailConfigId)
  if (!config) {
    fail(res, '邮箱配置不存在', 404)
    return
  }

  try {
    let mails = await imapService.fetchMailList(config, folder, limit)

    // 本地筛选
    if (filter === 'unread') {
      mails = mails.filter((m) => !m.isRead)
    } else if (filter === 'read') {
      mails = mails.filter((m) => m.isRead)
    }

    success(res, mails, '获取成功')
  } catch (err) {
    // 透传 imapflow 的详细错误信息（如认证失败、连接超时等）
    let detail = err instanceof Error ? err.message : '获取邮件列表失败'
    if ((err as any).authenticationFailed) {
      detail = '邮箱认证失败，请检查账号和授权码是否正确'
    } else if ((err as any).responseText) {
      detail = `${detail}: ${(err as any).responseText}`
    }
    error(res, detail, 500)
  }
}

/** 获取邮件详情 */
export async function getMailDetail(req: Request, res: Response) {
  const uid = getStr(req.params.id)
  const emailConfigId = getStr(req.query.emailConfigId)

  if (!uid || !emailConfigId) {
    fail(res, '参数校验失败：id 和 emailConfigId 不能为空', 400)
    return
  }

  const config = emailConfigStore.getById(emailConfigId)
  if (!config) {
    fail(res, '邮箱配置不存在', 404)
    return
  }

  try {
    const detail = await imapService.fetchMailDetail(config, 'INBOX', uid)
    success(res, detail, '获取成功')
  } catch (err) {
    let detail = err instanceof Error ? err.message : '获取邮件详情失败'
    if ((err as any).authenticationFailed) {
      detail = '邮箱认证失败，请检查账号和授权码是否正确'
    }
    error(res, detail, 500)
  }
}

/** 回复邮件 */
export async function replyMail(req: Request, res: Response) {
  const { emailConfigId, to, subject, body, inReplyTo } = req.body

  if (!emailConfigId || !to || !subject || !body) {
    fail(res, '参数校验失败：emailConfigId、to、subject、body 不能为空', 400)
    return
  }

  const config = emailConfigStore.getById(emailConfigId)
  if (!config) {
    fail(res, '邮箱配置不存在', 404)
    return
  }

  try {
    await smtpService.sendMail(config, { emailConfigId, to, subject, body, inReplyTo })
    success(res, { success: true }, '回复成功')
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : '发送失败'
    let detail = rawMsg
    if ((err as any).authenticationFailed || /auth/i.test(rawMsg)) {
      detail = '邮箱认证失败，请检查授权码是否正确'
    }
    error(res, `发送失败: ${detail}`, 500)
  }
}

/** 标记已读 */
export async function markAsRead(req: Request, res: Response) {
  const uid = getStr(req.params.id)
  const emailConfigId = getStr(req.query.emailConfigId)

  if (!uid || !emailConfigId) {
    fail(res, '参数校验失败：id 和 emailConfigId 不能为空', 400)
    return
  }

  const config = emailConfigStore.getById(emailConfigId)
  if (!config) {
    fail(res, '邮箱配置不存在', 404)
    return
  }

  try {
    await imapService.markAsRead(config, 'INBOX', uid)
    success(res, { success: true }, '标记成功')
  } catch (err) {
    let detail = err instanceof Error ? err.message : '标记已读失败'
    if ((err as any).authenticationFailed) {
      detail = '邮箱认证失败，请检查账号和授权码是否正确'
    }
    error(res, detail, 500)
  }
}
