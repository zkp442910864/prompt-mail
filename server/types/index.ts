// ==================== 通用类型 ====================

/** 统一响应格式 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 邮箱地址 */
export interface EmailAddress {
  name: string
  address: string
}

// ==================== 邮箱配置 ====================

export interface EmailConfig {
  id: string
  type: 'aliyun' | 'aliyun-enterprise' | 'qq' | 'custom'
  imapHost: string
  imapPort: number
  smtpHost: string
  smtpPort: number
  account: string
  authCode: string
  createdAt: string
  updatedAt: string
}

export type CreateEmailConfig = Omit<EmailConfig, 'id' | 'createdAt' | 'updatedAt'>

// ==================== AI 配置 ====================

export interface AIConfig {
  id: string
  apiBaseUrl: string
  apiKey: string
  model: string
  systemPrompt: string
  createdAt: string
  updatedAt: string
}

export type CreateAIConfig = Omit<AIConfig, 'id' | 'createdAt' | 'updatedAt'>

// ==================== 邮件相关 ====================

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
  date: string
  messageId: string
  text: string
  html: string
  attachments: AttachmentMeta[]
}

export interface MailListParams {
  folder: string
  filter: 'all' | 'unread' | 'read'
  limit: number
  emailConfigId: string
}

export interface MailReplyRequest {
  emailConfigId: string
  to: string[]
  subject: string
  body: string
  inReplyTo: string
}

// ==================== AI 相关 ====================

export interface AiGenerateRequest {
  subject: string
  from: string
  body: string
  prompt: string
}

export interface AiGenerateResponse {
  content: string
}
