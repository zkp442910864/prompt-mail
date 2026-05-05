import { describe, it, expect, vi } from 'vitest'

// Mock DOMPurify for Node.js environment
vi.mock('dompurify', () => ({
  default: {
    sanitize: (html: string, config: any) => {
      // Simple mock that removes script tags and on* attributes
      let result = html
      // Remove script tags
      result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      // Remove on* event attributes
      result = result.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: in href
      result = result.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')
      return result
    },
  },
}))

import { sanitizeHtml } from '../utils/sanitizer'

describe('sanitizer', () => {
  it('should remove script tags (XSS)', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<script')
    expect(result).not.toContain('alert')
  })

  it('should remove onclick attributes', () => {
    const input = '<div onclick="alert(1)">Click me</div>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('onclick')
  })

  it('should remove javascript: in href', () => {
    const input = '<a href="javascript:alert(1)">Link</a>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('javascript:')
  })

  it('should preserve safe HTML tags', () => {
    const input = '<p>Hello <strong>world</strong></p>'
    const result = sanitizeHtml(input)
    expect(result).toContain('<p>')
    expect(result).toContain('<strong>')
  })

  it('should handle empty input', () => {
    const result = sanitizeHtml('')
    expect(result).toBe('')
  })
})
