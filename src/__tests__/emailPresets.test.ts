import { describe, it, expect } from 'vitest'
import { EMAIL_PRESETS } from '../utils/emailPresets'

describe('emailPresets', () => {
  it('should have aliyun preset with correct values', () => {
    expect(EMAIL_PRESETS.aliyun).toEqual({
      imapHost: 'imap.aliyun.com',
      imapPort: 993,
      smtpHost: 'smtp.aliyun.com',
      smtpPort: 465,
    })
  })

  it('should have qq preset with correct values', () => {
    expect(EMAIL_PRESETS.qq).toEqual({
      imapHost: 'imap.qq.com',
      imapPort: 993,
      smtpHost: 'smtp.qq.com',
      smtpPort: 465,
    })
  })

  it('should only have aliyun and qq presets', () => {
    expect(Object.keys(EMAIL_PRESETS)).toEqual(['aliyun', 'qq'])
  })
})
