import type { Request, Response } from 'express'
import * as aiConfigStore from '../stores/aiConfigStore.js'
import * as aiService from '../services/aiService.js'
import { success, fail } from '../utils/response.js'

/** 获取 AI 配置列表 */
export async function getAiConfig(_req: Request, res: Response) {
  const configs = aiConfigStore.getAll()
  success(res, configs, '获取成功')
}

/** 保存 AI 配置 */
export async function saveAiConfig(req: Request, res: Response) {
  const { apiBaseUrl, apiKey, model, systemPrompt } = req.body

  if (!apiBaseUrl || !apiKey || !model) {
    fail(res, '参数校验失败：apiBaseUrl、apiKey、model 不能为空', 400)
    return
  }

  const config = aiConfigStore.save({
    apiBaseUrl,
    apiKey,
    model,
    systemPrompt: systemPrompt || '',
  })
  success(res, config, '保存成功')
}

/** 测试 AI 连接 */
export async function testAiConnection(req: Request, res: Response) {
  const { apiBaseUrl, apiKey, model } = req.body

  if (!apiBaseUrl || !apiKey || !model) {
    fail(res, '参数校验失败：apiBaseUrl、apiKey、model 不能为空', 400)
    return
  }

  const result = await aiService.testConnection({ apiBaseUrl, apiKey, model })
  success(res, result, '测试完成')
}
