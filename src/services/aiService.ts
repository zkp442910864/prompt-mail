import request from './request'
import type { ApiResponse } from '@/types/api'
import type { AiGenerateRequest, AiGenerateResponse, AiTranslateRequest, AiTranslateResponse } from '@/types/mail'

/** AI 生成回复 */
export function generateReply(data: AiGenerateRequest) {
  return request.post<unknown, ApiResponse<AiGenerateResponse>>('/ai/generate', data, {
    timeout: 120000, // AI 接口 120 秒超时
  })
}

/** AI 翻译邮件为中文 */
export function translateToChinese(data: AiTranslateRequest) {
  return request.post<unknown, ApiResponse<AiTranslateResponse>>('/ai/translate', data, {
    timeout: 120000,
  })
}
