import { simpleParser } from 'mailparser'
import type { ParsedMail, Attachment } from 'mailparser'
import type { AttachmentMeta } from '../types/index.js'

/** 解析 MIME 源数据为结构化邮件对象 */
export async function parseMimeSource(raw: Buffer): Promise<ParsedMail> {
  return simpleParser(raw)
}

/** 从解析后的邮件对象提取附件元数据 */
export function extractAttachments(
  parsed: ParsedMail,
  uid: string,
): AttachmentMeta[] {
  if (!parsed.attachments || parsed.attachments.length === 0) {
    return []
  }

  return parsed.attachments.map((att: Attachment, index: number) => {
    const partNumber = String(index + 1)
    return {
      id: `${uid}-${partNumber}-${att.filename || `attachment-${index + 1}`}`,
      filename: att.filename || `attachment-${index + 1}`,
      size: att.size,
      contentType: att.contentType,
    }
  })
}

/** 解码附件 ID，提取 uid、partNumber、filename */
export function decodeAttachmentId(
  attachmentId: string,
): { uid: string; partNumber: string; filename: string } {
  // 格式: {uid}-{partNumber}-{filename}
  // filename 可能包含 -，所以只从前缀解析 uid 和 partNumber
  const firstDash = attachmentId.indexOf('-')
  if (firstDash === -1) {
    throw new Error(`无效的附件 ID 格式: ${attachmentId}`)
  }
  const uid = attachmentId.slice(0, firstDash)
  const rest = attachmentId.slice(firstDash + 1)
  const secondDash = rest.indexOf('-')
  if (secondDash === -1) {
    throw new Error(`无效的附件 ID 格式: ${attachmentId}`)
  }
  const partNumber = rest.slice(0, secondDash)
  const filename = rest.slice(secondDash + 1)
  return { uid, partNumber, filename }
}
