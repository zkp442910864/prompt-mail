import { useQuery } from '@tanstack/react-query'
import * as mailService from '@/services/mailService'

/** 邮件详情查询 */
export function useMailDetail(uid: string | null, emailConfigId: string | null) {
  return useQuery({
    queryKey: ['mailDetail', uid, emailConfigId],
    queryFn: async () => {
      const res = await mailService.getMailDetail(uid!, emailConfigId!)
      return res.data
    },
    enabled: !!uid && !!emailConfigId,
  })
}
