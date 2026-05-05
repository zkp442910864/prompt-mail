import { useMutation } from '@tanstack/react-query'
import { message } from 'antd'
import * as mailService from '@/services/mailService'
import type { MailReplyRequest } from '@/types/mail'

/** 回复邮件 */
export function useMailReply() {
  return useMutation({
    mutationFn: (data: MailReplyRequest) => mailService.replyMail(data),
    onSuccess: () => {
      message.success('回复发送成功')
    },
  })
}
