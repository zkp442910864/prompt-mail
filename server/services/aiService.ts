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
        { role: 'user', content: '请根据邮件的语言生成回复（如英文邮件用英文回复，中文邮件用中文回复）。同时，请在回复内容之后，用"---"分隔，附上该回复的中文翻译版本，以便用户对照检查内容是否准确。格式如下：\n\n[邮件语言回复内容]\n---\n[中文翻译]' },
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

/** AI 翻译邮件为中文 */
export async function translateToChinese(
  config: AIConfig,
  data: { subject: string; body: string },
): Promise<AiGenerateResponse> {
  const url = `${config.apiBaseUrl.replace(/\/+$/, '')}/chat/completions`

  // 判断 body 是否包含 HTML
  const isHtml = /<[a-zA-Z][^>]*>/.test(data.body)

  const systemPrompt = isHtml
    ? `你是一个专业的邮件翻译助手。请将用户提供的 HTML 邮件内容翻译为中文。

重要规则：
1. 必须保持原有的 HTML 结构完全不变（包括表格、div、span 等所有标签及其嵌套关系）
2. 只翻译标签之间的文字内容，不要修改任何 HTML 标签、属性、class、style
3. 保持原有的样式属性（如 style、color、bgcolor 等）不变
4. 如果文字本身就是中文，保持不变
5. 只输出翻译后的完整 HTML，不要添加任何解释、注释或额外内容
6. 不要用 Markdown 代码块包裹输出`
    : `你是一个专业的邮件翻译助手。请将用户提供的邮件内容翻译为中文。只输出翻译结果，不要添加任何解释、注释或额外内容。如果邮件本身就是中文，直接返回原文。`

  const userContent = [
    `邮件主题: ${data.subject}`,
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
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AI API 请求失败 (${response.status}): ${errorText}`)
  }

  const result = (await response.json()) as {
    choices: Array<{ message: { content: string } }>
  }

  let content = result.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('AI 返回内容为空')
  }

  // 清理 AI 可能包裹的 Markdown 代码块标记
  content = content.replace(/^```html?\s*\n?/i, '').replace(/\n?```\s*$/i, '')

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
