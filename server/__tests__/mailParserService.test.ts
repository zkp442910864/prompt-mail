import { describe, it, expect } from 'vitest'
import { decodeAttachmentId } from '../services/mailParserService.js'

describe('attachment ID encode/decode', () => {
  it('should decode a simple attachment ID', () => {
    const result = decodeAttachmentId('12345-1-report.pdf')
    expect(result).toEqual({
      uid: '12345',
      partNumber: '1',
      filename: 'report.pdf',
    })
  })

  it('should handle filename with dashes', () => {
    const result = decodeAttachmentId('99-2-my-file-name.pdf')
    expect(result).toEqual({
      uid: '99',
      partNumber: '2',
      filename: 'my-file-name.pdf',
    })
  })

  it('should handle filename with multiple dashes', () => {
    const result = decodeAttachmentId('1-3-a-b-c-d.txt')
    expect(result).toEqual({
      uid: '1',
      partNumber: '3',
      filename: 'a-b-c-d.txt',
    })
  })

  it('should throw for invalid format (no dash)', () => {
    expect(() => decodeAttachmentId('invalid')).toThrow('无效的附件 ID 格式')
  })

  it('should throw for format with only one dash', () => {
    expect(() => decodeAttachmentId('123-onlyonepart')).toThrow('无效的附件 ID 格式')
  })
})
