export interface EmailAddress {
  name: string
  address: string
}

export interface MailSummary {
  id: string
  subject: string
  from: EmailAddress
  date: string
  isRead: boolean
  hasAttachments: boolean
  snippet: string
}

export interface AttachmentMeta {
  id: string
  filename: string
  size: number
  contentType: string
}

export interface MailDetail {
  id: string
  subject: string
  from: EmailAddress
  to: EmailAddress[]
  cc: EmailAddress[]
  replyTo: EmailAddress[]
  date: string
  messageId: string
  text: string
  html: string
  attachments: AttachmentMeta[]
}

export interface MailListParams {
  folder?: string
  filter?: 'all' | 'unread' | 'read'
  limit?: number
  emailConfigId: string
  keyword?: string
}

export interface MailReplyRequest {
  emailConfigId: string
  to: string[]
  subject: string
  body: string
  inReplyTo: string
}

export interface AiGenerateRequest {
  subject: string
  from: string
  body: string
  prompt: string
  extraPrompt?: string
}

export interface AiGenerateResponse {
  content: string
}

export interface AiTranslateRequest {
  subject: string
  body: string
}

export interface AiTranslateResponse {
  content: string
}

/** 邮件筛选类型 */
export type MailFilter = 'all' | 'unread' | 'read'
