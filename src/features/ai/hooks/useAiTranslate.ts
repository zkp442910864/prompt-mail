import { useMutation } from '@tanstack/react-query'
import { message } from 'antd'
import * as aiService from '@/services/aiService'
import type { AiTranslateRequest } from '@/types/mail'

/** AI 翻译邮件为中文 */
export function useAiTranslate() {
  return useMutation({
    mutationFn: (data: AiTranslateRequest) => aiService.translateToChinese(data),
    onError: (err) => {
      message.error(`AI 翻译失败: ${err.message}`)
    },
  })
}
