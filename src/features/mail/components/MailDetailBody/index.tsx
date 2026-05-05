import { useMemo } from 'react'
import { sanitizeHtml } from '@/utils/sanitizer'

interface MailDetailBodyProps {
  html?: string
  text?: string
}

export default function MailDetailBody({ html, text }: MailDetailBodyProps) {
  const sanitizedHtml = useMemo(() => {
    if (!html) return ''
    return sanitizeHtml(html)
  }, [html])

  if (sanitizedHtml) {
    return (
      <div
        className="px-6 py-4 mail-body"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    )
  }

  return (
    <div className="px-6 py-4 whitespace-pre-wrap text-gray-700">
      {text || '(邮件正文为空)'}
    </div>
  )
}
