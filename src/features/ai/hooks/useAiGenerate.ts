import { useMutation } from '@tanstack/react-query'
import { message } from 'antd'
import * as aiService from '@/services/aiService'
import type { AiGenerateRequest } from '@/types/mail'

/** AI 生成回复 */
export function useAiGenerate() {
  return useMutation({
    mutationFn: (data: AiGenerateRequest) => aiService.generateReply(data),
    onSuccess: () => {
      message.success('AI 回复生成成功')
    },
    onError: (err) => {
      message.error(`AI 生成失败: ${err.message}`)
    },
  })
}
