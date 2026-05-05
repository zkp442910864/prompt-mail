import request from './request'
import type { ApiResponse } from '@/types/api'
import type { MailSummary, MailDetail, MailListParams, MailReplyRequest } from '@/types/mail'

/** 获取邮件列表 */
export function getMailList(params: MailListParams) {
  return request.get<unknown, ApiResponse<MailSummary[]>>('/mail/list', { params })
}

/** 获取邮件详情 */
export function getMailDetail(id: string, emailConfigId: string) {
  return request.get<unknown, ApiResponse<MailDetail>>(`/mail/${id}`, {
    params: { emailConfigId },
  })
}

/** 回复邮件 */
export function replyMail(data: MailReplyRequest) {
  return request.post<unknown, ApiResponse<{ success: boolean }>>('/mail/reply', data)
}

/** 标记已读 */
export function markAsRead(id: string, emailConfigId: string) {
  return request.patch<unknown, ApiResponse<{ success: boolean }>>(`/mail/${id}/read`, null, {
    params: { emailConfigId },
  })
}
