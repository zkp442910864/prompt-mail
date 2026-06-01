/**
 * 从邮件正文中提取邮箱地址
 * 
 * 适用场景：Shopify 等平台通知邮件，发件人是系统邮箱（如 notifications@store.shopify.com），
 * 客户真实邮箱在正文中。优先提取正文中的客户邮箱作为回复目标。
 */

/** 常见的系统/通知邮箱域名，这些不是客户邮箱 */
const SYSTEM_EMAIL_PATTERNS = [
  /@shopify\.com$/i,
  /@store\.shopify\.com$/i,
  /notifications@/i,
  /noreply@/i,
  /no-reply@/i,
  /mailer@/i,
  /notification@/i,
  /automated@/i,
  /@amazon\.com$/i,
  /@ebay\.com$/i,
  /@paypal\.com$/i,
  /@stripe\.com$/i,
  /@alibaba\.com$/i,
  /@aliexpress\.com$/i,
]

/** 提取正文中的所有邮箱地址 */
export function extractEmailsFromText(text: string): string[] {
  if (!text) return []
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const matches = text.match(emailRegex)
  if (!matches) return []
  // 去重
  return [...new Set(matches.map((e) => e.toLowerCase()))]
}

/** 判断是否为系统/通知邮箱 */
export function isSystemEmail(email: string): boolean {
  return SYSTEM_EMAIL_PATTERNS.some((pattern) => pattern.test(email))
}

/**
 * 从邮件中提取回复目标邮箱
 * 
 * 策略：
 * 1. 如果发件人不是系统/通知邮箱 → 直接使用发件人地址（正常邮件的合理回复目标）
 * 2. 如果发件人是系统邮箱（如 Shopify notifications） → 从正文中提取客户邮箱
 * 3. 正文中也没找到 → 回退到发件人地址
 */
export function extractReplyToEmail(
  fromAddress: string,
  bodyText: string,
  bodyHtml?: string,
): string {
  // 非系统邮箱 → 就是客户本人，直接回复
  if (!isSystemEmail(fromAddress)) {
    return fromAddress
  }

  // 系统邮箱 → 从正文提取客户邮箱
  const content = bodyHtml || bodyText || ''
  const emails = extractEmailsFromText(content)

  // 过滤掉系统邮箱，保留客户邮箱
  const customerEmails = emails.filter(
    (email) => !isSystemEmail(email),
  )

  if (customerEmails.length > 0) {
    return customerEmails[0]!
  }

  // 正文中也没找到客户邮箱，回退到 from 地址
  return fromAddress
}

/**
 * 判断邮件的 from 地址是否为系统/通知邮箱
 * 如果是，说明客户的真实邮箱可能在正文中
 */
export function isFromSystemEmail(fromAddress: string): boolean {
  return isSystemEmail(fromAddress)
}
