import type { Request, Response } from 'express'
import * as aiConfigStore from '../stores/aiConfigStore.js'
import * as aiService from '../services/aiService.js'
import { success, fail, error } from '../utils/response.js'

/** AI 生成回复 */
export async function generateReply(req: Request, res: Response) {
  const { subject, from, body, prompt } = req.body

  if (!subject || !from || !body) {
    fail(res, '参数校验失败：subject、from、body 不能为空', 400)
    return
  }

  // 获取第一个 AI 配置
  const configs = aiConfigStore.getAll()
  if (configs.length === 0) {
    fail(res, '请先配置 AI 服务', 400)
    return
  }
  const config = configs[0]!

  try {
    const result = await aiService.generateReply(config, {
      subject,
      from,
      body,
      prompt: prompt || config.systemPrompt || '',
    })
    success(res, result, '生成成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 服务调用失败'
    error(res, `AI 服务调用失败: ${message}`, 500)
  }
}

/** AI 翻译邮件为中文 */
export async function translateToChinese(req: Request, res: Response) {
  const { subject, body } = req.body

  if (!subject || !body) {
    fail(res, '参数校验失败：subject、body 不能为空', 400)
    return
  }

  // 获取第一个 AI 配置
  const configs = aiConfigStore.getAll()
  if (configs.length === 0) {
    fail(res, '请先配置 AI 服务', 400)
    return
  }
  const config = configs[0]!

  try {
    const result = await aiService.translateToChinese(config, { subject, body })
    success(res, result, '翻译成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI 翻译服务调用失败'
    error(res, `AI 翻译失败: ${message}`, 500)
  }
}
