import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import * as aiConfigService from '@/services/aiConfigService'
import type { CreateAIConfig } from '@/types/aiConfig'

/** AI 配置列表查询 */
export function useAiConfig() {
  return useQuery({
    queryKey: ['aiConfig'],
    queryFn: async () => {
      const res = await aiConfigService.getAiConfig()
      return res.data
    },
  })
}

/** 保存 AI 配置 */
export function useSaveAiConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAIConfig) => aiConfigService.saveAiConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiConfig'] })
      message.success('AI 配置保存成功')
    },
  })
}

/** 测试 AI 连接 */
export function useTestAiConnection() {
  return useMutation({
    mutationFn: aiConfigService.testAiConnection,
    onSuccess: (res) => {
      const { success, message: msg } = res.data
      if (success) {
        message.success('AI 连接测试成功')
      } else {
        message.error(`AI 连接失败: ${msg}`)
      }
    },
  })
}
