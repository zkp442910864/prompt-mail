import type { AIConfig, AiGenerateRequest, AiGenerateResponse } from '../types/index.js'

/** 最大 body 长度（字符数），超过则截断避免 token 超限 */
const MAX_BODY_LENGTH = 8000

/**
 * 清理 HTML，移除可能导致 AI 调用失败的内容：
 * - base64 图片（可能几 MB，远超 token 限制）
 * - cid 引用图片（无实际内容，增加无效 token）
 * - style/script 标签块
 * - 注释
 */
function stripHtmlForAI(html: string): string {
  // 移除 <img> 标签（base64 图片是主要元凶）
  let cleaned = html.replace(/<img[^>]*\/?>/gi, '')
  // 移除 <style>...</style> 块
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  // 移除 <script>...</script> 块
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  // 移除 HTML 注释
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')
  // 移除行内 base64 data URI（src="data:..." 等残留）
  cleaned = cleaned.replace(/\s(src|href|background|poster)="data:[^"]*"/gi, ' $1=""')
  // 压缩连续空白行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  return cleaned.trim()
}

/** 将 HTML 转为纯文本，作为 AI body 最后的兜底 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** 准备发送给 AI 的 body 内容：清洗 HTML → 截断 → 兜底纯文本 */
function prepareBody(rawBody: string): string {
  let body = rawBody

  // 检测是否为 HTML
  const isHtml = /<[a-zA-Z][^>]*>/.test(body)

  if (isHtml) {
    body = stripHtmlForAI(body)
  }

  // 截断过长内容
  if (body.length > MAX_BODY_LENGTH) {
    if (isHtml) {
      // HTML 太长 → 转纯文本（去掉所有标签后应该会短很多）
      body = htmlToPlainText(body)
    }
    if (body.length > MAX_BODY_LENGTH) {
      body = body.slice(0, MAX_BODY_LENGTH) + '\n...(内容已截断)'
    }
  }

  return body
}

/** 调用 OpenAI 兼容 API 生成回复 */
export async function generateReply(
  config: AIConfig,
  data: AiGenerateRequest,
): Promise<AiGenerateResponse> {
  const url = `${config.apiBaseUrl.replace(/\/+$/, '')}/chat/completions`

  const cleanedBody = prepareBody(data.body)

  const userContent = [
    `邮件主题: ${data.subject}`,
    `发件人: ${data.from}`,
    `邮件正文:\n${cleanedBody}`,
  ].join('\n\n')

  // 构建额外提示词指令
  const extraInstruction = data.extraPrompt
    ? `\n\n用户的额外的回复要求：${data.extraPrompt}`
    : ''

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
        { role: 'user', content: `请根据邮件的语言生成回复（如英文邮件用英文回复，中文邮件用中文回复）。同时，请在回复内容之后，用"---"分隔，附上该回复的中文翻译版本，以便用户对照检查内容是否准确。格式如下：\n\n[邮件语言回复内容]\n---\n[中文翻译]${extraInstruction}` },
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

  const cleanedBody = prepareBody(data.body)

  // 判断 body 是否包含 HTML
  const isHtml = /<[a-zA-Z][^>]*>/.test(cleanedBody)

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
    `邮件正文:\n${cleanedBody}`,
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
