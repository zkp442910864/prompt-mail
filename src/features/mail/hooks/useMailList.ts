import { useQuery } from '@tanstack/react-query'
import * as mailService from '@/services/mailService'
import type { MailListParams } from '@/types/mail'

/** 邮件列表查询 */
export function useMailList(params: MailListParams) {
  const enabled = !!params.emailConfigId

  return useQuery({
    queryKey: ['mailList', params],
    queryFn: async () => {
      const res = await mailService.getMailList(params)
      return res.data
    },
    enabled,
    placeholderData: (previousData) => previousData,
  })
}
