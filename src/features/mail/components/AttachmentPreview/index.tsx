import { Modal } from 'antd'
import type { AttachmentMeta } from '@/types/mail'

interface AttachmentPreviewProps {
  attachment: AttachmentMeta
  previewUrl: string
  open: boolean
  onClose: () => void
}

export default function AttachmentPreview({ attachment, previewUrl, open, onClose }: AttachmentPreviewProps) {
  const isImage = /^image\//.test(attachment.contentType)
  const isPdf = attachment.contentType === 'application/pdf'
  const isText = /^text\//.test(attachment.contentType)

  const renderContent = () => {
    if (isImage) {
      return (
        <div className="flex items-center justify-center p-4">
          <img
            src={previewUrl}
            alt={attachment.filename}
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
          />
        </div>
      )
    }

    if (isPdf) {
      return (
        <iframe
          src={previewUrl}
          width="100%"
          height="70vh"
          title={attachment.filename}
        />
      )
    }

    if (isText) {
      return (
        <iframe
          src={previewUrl}
          width="100%"
          height="70vh"
          title={attachment.filename}
        />
      )
    }

    return <div className="p-4 text-center text-gray-500">不支持预览此类型文件</div>
  }

  return (
    <Modal
      title={attachment.filename}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnClose
    >
      {renderContent()}
    </Modal>
  )
}
