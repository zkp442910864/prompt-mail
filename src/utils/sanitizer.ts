import DOMPurify from 'dompurify'

/** DOMPurify 配置：允许邮件 HTML 中常用的标签和属性 */
const ALLOWED_TAGS = [
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'a',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'img', 'div', 'span', 'blockquote', 'pre', 'code',
  'hr', 'font', 'sub', 'sup',
]

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'src', 'alt', 'width', 'height',
  'style', 'class', 'color', 'size', 'face',
]

/** 净化 HTML 内容，防止 XSS 攻击 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  })
}
