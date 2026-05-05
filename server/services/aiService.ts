import type { AIConfig, AiGenerateRequest, AiGenerateResponse } from '../types/index.js'

/** 调用 OpenAI 兼容 API 生成回复 */
export async function generateReply(
  config: AIConfig,
  data: AiGenerateRequest,
): Promise<AiGenerateResponse> {
  const url = `${config.apiBaseUrl.replace(/\/+$/, '')}/chat/completions`

  const userContent = [
    `邮件主题: ${data.subject}`,
    `发件人: ${data.from}`,
    `邮件正文:\n${data.body}`,
  ].join('\n\n')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt || '你是一个专业的邮件回复助手。' },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AI API 请求失败 (${response.status}): ${errorText}`)
  }

  const result = (await response.json()) as {
    choices: Array<{ message: { content: string } }>
  }

  const content = result.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('AI 返回内容为空')
  }

  return { content }
}

/** 测试 AI 连接 */
export async function testConnection(
  config: Pick<AIConfig, 'apiBaseUrl' | 'apiKey' | 'model'>,
): Promise<{ success: boolean; message: string }> {
  try {
    const url = `${config.apiBaseUrl.replace(/\/+$/, '')}/chat/completions`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
    })

    if (response.ok) {
      return { success: true, message: '连接成功' }
    }

    const errorText = await response.text()
    return { success: false, message: `API 返回错误 (${response.status}): ${errorText.slice(0, 100)}` }
  } catch (err) {
    const message = err instanceof Error ? err.message : '连接失败'
    return { success: false, message }
  }
}
