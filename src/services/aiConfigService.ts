import request from './request'
import type { ApiResponse } from '@/types/api'
import type { AIConfig, CreateAIConfig } from '@/types/aiConfig'

/** 获取 AI 配置列表 */
export function getAiConfig() {
  return request.get<unknown, ApiResponse<AIConfig[]>>('/config/ai')
}

/** 保存 AI 配置 */
export function saveAiConfig(data: CreateAIConfig) {
  return request.post<unknown, ApiResponse<AIConfig>>('/config/ai', data)
}

/** 测试 AI 连接 */
export function testAiConnection(data: Pick<AIConfig, 'apiBaseUrl' | 'apiKey' | 'model'>) {
  return request.post<unknown, ApiResponse<{ success: boolean; message: string }>>('/config/ai/test', data)
}
