import type { EmailConfig } from '../types/index.js'
import { fetchAttachment as imapFetchAttachment } from './imapService.js'
import { decodeAttachmentId } from './mailParserService.js'

/** 拉取附件二进制数据 */
export async function fetchAttachment(
  config: EmailConfig,
  uid: string,
  attachmentId: string,
): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  const { partNumber, filename } = decodeAttachmentId(attachmentId)
  const buffer = await imapFetchAttachment(config, 'INBOX', uid, partNumber)

  // 根据文件扩展名推断 Content-Type
  const contentType = guessContentType(filename)

  return { buffer, filename, contentType }
}

/** 根据文件扩展名推断 Content-Type */
function guessContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    txt: 'text/plain',
    csv: 'text/csv',
    html: 'text/html',
    htm: 'text/html',
    json: 'application/json',
    xml: 'application/xml',
    zip: 'application/zip',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  }
  return mimeMap[ext || ''] || 'application/octet-stream'
}
