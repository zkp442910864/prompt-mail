import { useState } from 'react'
import { Button, Space, Tag } from 'antd'
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import { useAttachment } from '../../hooks/useAttachment'
import AttachmentPreview from '../AttachmentPreview'
import type { AttachmentMeta } from '@/types/mail'

interface AttachmentItemProps {
  attachment: AttachmentMeta
  emailConfigId: string
  uid: string
}

/** 格式化文件大小 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export default function AttachmentItem({ attachment, emailConfigId, uid }: AttachmentItemProps) {
  const { download, getPreviewUrl } = useAttachment()
  const [previewOpen, setPreviewOpen] = useState(false)

  const isPreviewable = /\.(png|jpg|jpeg|gif|svg|webp|pdf|txt|csv|html?)$/i.test(attachment.filename)

  return (
    <>
      <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <Tag color="blue">{attachment.contentType.split('/')[1]?.toUpperCase() || 'FILE'}</Tag>
          <span className="text-sm text-gray-700">{attachment.filename}</span>
          <span className="text-xs text-gray-400">({formatSize(attachment.size)})</span>
        </div>
        <Space size="small">
          {isPreviewable && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setPreviewOpen(true)}
            >
              在线查看
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => download(attachment.id, emailConfigId, uid)}
          >
            下载
          </Button>
        </Space>
      </div>

      {previewOpen && (
        <AttachmentPreview
          attachment={attachment}
          previewUrl={getPreviewUrl(attachment.id, emailConfigId, uid)}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  )
}
