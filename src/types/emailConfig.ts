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
