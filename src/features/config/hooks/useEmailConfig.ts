import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import * as emailConfigService from '@/services/emailConfigService'
import type { CreateEmailConfig } from '@/types/emailConfig'

/** 邮箱配置列表查询 */
export function useEmailConfig() {
  return useQuery({
    queryKey: ['emailConfig'],
    queryFn: async () => {
      const res = await emailConfigService.getEmailConfig()
      return res.data
    },
  })
}

/** 保存邮箱配置 */
export function useSaveEmailConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEmailConfig) => emailConfigService.saveEmailConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailConfig'] })
      message.success('邮箱配置保存成功')
    },
  })
}

/** 测试邮箱连接 */
export function useTestEmailConnection() {
  return useMutation({
    mutationFn: emailConfigService.testEmailConnection,
    onSuccess: (res) => {
      const { imap, smtp } = res.data
      if (imap && smtp) {
        message.success('IMAP 和 SMTP 连接成功')
      } else {
        if (!imap) message.warning('IMAP 连接失败')
        if (!smtp) message.warning('SMTP 连接失败')
      }
    },
  })
}
