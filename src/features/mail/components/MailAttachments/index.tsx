import { PaperClipOutlined } from '@ant-design/icons'
import AttachmentItem from '../AttachmentItem'
import type { AttachmentMeta } from '@/types/mail'

interface MailAttachmentsProps {
  attachments: AttachmentMeta[]
  emailConfigId: string
  uid: string
}

export default function MailAttachments({ attachments, emailConfigId, uid }: MailAttachmentsProps) {
  if (attachments.length === 0) return null

  return (
    <div className="px-6 py-3 border-t border-gray-200">
      <div className="flex items-center gap-1 mb-2 text-sm text-gray-500">
        <PaperClipOutlined />
        <span>附件 ({attachments.length})</span>
      </div>
      <div className="flex flex-col gap-2">
        {attachments.map((att) => (
          <AttachmentItem
            key={att.id}
            attachment={att}
            emailConfigId={emailConfigId}
            uid={uid}
          />
        ))}
      </div>
    </div>
  )
}
