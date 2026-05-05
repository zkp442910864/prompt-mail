import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as mailService from '@/services/mailService'
import type { MailSummary } from '@/types/mail'

/** 标记邮件已读（乐观更新，静默无提示） */
export function useMarkRead(emailConfigId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ uid }: { uid: string }) =>
      mailService.markAsRead(uid, emailConfigId!),
    onMutate: async ({ uid }) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['mailList'] })

      // 保存所有 mailList 查询的快照，用于回滚
      const previousLists = new Map<string, unknown>()
      queryClient.getQueriesData({ queryKey: ['mailList'] }).forEach(([key, data]) => {
        previousLists.set(JSON.stringify(key), data)
      })

      // 乐观更新：将邮件标记为已读
      // 查询数据直接是 MailSummary[]（useMailList 返回 res.data）
      queryClient.setQueriesData<MailSummary[]>(
        { queryKey: ['mailList'] },
        (old) => {
          if (!old) return old
          return old.map((mail) =>
            mail.id === uid ? { ...mail, isRead: true } : mail,
          )
        },
      )

      return { previousLists }
    },
    onError: (_err, _vars, context) => {
      // 回滚所有受影响的查询
      if (context?.previousLists) {
        context.previousLists.forEach((data, keyStr) => {
          const key = JSON.parse(keyStr)
          queryClient.setQueryData(key, data)
        })
      }
      console.error('标记已读失败:', _err)
    },
    onSettled: () => {
      // mutation 结束后刷新列表，确保与后端一致
      queryClient.invalidateQueries({ queryKey: ['mailList'] })
    },
  })
}
