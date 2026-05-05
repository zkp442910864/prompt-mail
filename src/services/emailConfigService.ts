import request from './request'
import type { ApiResponse } from '@/types/api'
import type { EmailConfig, CreateEmailConfig } from '@/types/emailConfig'

/** 获取邮箱配置列表 */
export function getEmailConfig() {
  return request.get<unknown, ApiResponse<EmailConfig[]>>('/config/email')
}

/** 保存邮箱配置 */
export function saveEmailConfig(data: CreateEmailConfig) {
  return request.post<unknown, ApiResponse<EmailConfig>>('/config/email', data)
}

/** 测试邮箱连接 */
export function testEmailConnection(data: Pick<EmailConfig, 'imapHost' | 'imapPort' | 'smtpHost' | 'smtpPort' | 'account' | 'authCode'>) {
  return request.post<unknown, ApiResponse<{ imap: boolean; smtp: boolean }>>('/config/email/test', data)
}
