import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import * as mailService from '@/services/mailService'

/** 标记邮件已读（乐观更新） */
export function useMarkRead(emailConfigId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uid }: { uid: string }) =>
      mailService.markAsRead(uid, emailConfigId!),
    onMutate: async ({ uid }) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['mailList'] })

      // 保存当前列表快照
      const previousList = queryClient.getQueryData(['mailList', { emailConfigId, filter: 'all' }])

      // 乐观更新：将邮件标记为已读
      queryClient.setQueriesData<{ data: unknown }>(
        { queryKey: ['mailList'] },
        (old) => {
          if (!old) return old
          const data = old.data as import('@/types/mail').MailSummary[]
          return {
            ...old,
            data: data.map((mail) =>
              mail.id === uid ? { ...mail, isRead: true } : mail,
            ),
          }
        },
      )

      return { previousList }
    },
    onError: (_err, _vars, context) => {
      // 回滚
      if (context?.previousList) {
        queryClient.setQueryData(['mailList'], context.previousList)
      }
      message.error('标记已读失败')
    },
    onSuccess: () => {
      message.success('已标记为已读')
    },
  })
}
