export interface EmailPreset {
  imapHost: string
  imapPort: number
  smtpHost: string
  smtpPort: number
}

/** 邮箱预设：阿里个人邮箱、阿里企业邮箱和 QQ 邮箱的 IMAP/SMTP 配置 */
export const EMAIL_PRESETS: Record<string, EmailPreset> = {
  aliyun: {
    imapHost: 'imap.aliyun.com',
    imapPort: 993,
    smtpHost: 'smtp.aliyun.com',
    smtpPort: 465,
  },
  'aliyun-enterprise': {
    imapHost: 'imap.qiye.aliyun.com',
    imapPort: 993,
    smtpHost: 'smtp.qiye.aliyun.com',
    smtpPort: 465,
  },
  qq: {
    imapHost: 'imap.qq.com',
    imapPort: 993,
    smtpHost: 'smtp.qq.com',
    smtpPort: 465,
  },
  custom: {
    imapHost: '',
    imapPort: 993,
    smtpHost: '',
    smtpPort: 465,
  },
}
