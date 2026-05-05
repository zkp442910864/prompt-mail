import nodemailer from 'nodemailer'
import type { EmailConfig, MailReplyRequest } from '../types/index.js'

/** 测试 SMTP 连接 */
export async function testConnection(config: EmailConfig): Promise<boolean> {
  const transporter = createTransporter(config)
  try {
    await transporter.verify()
    return true
  } catch {
    return false
  } finally {
    transporter.close()
  }
}

/** 创建 SMTP 传输 */
function createTransporter(config: EmailConfig) {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.account,
      pass: config.authCode,
    },
  })
}

/** 发送回复邮件 */
export async function sendMail(
  config: EmailConfig,
  data: MailReplyRequest,
): Promise<void> {
  const transporter = createTransporter(config)
  try {
    await transporter.sendMail({
      from: config.account,
      to: data.to.join(', '),
      subject: data.subject,
      html: data.body,
      inReplyTo: data.inReplyTo,
      references: data.inReplyTo,
    })
  } finally {
    transporter.close()
  }
}
