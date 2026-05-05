import { useCallback } from 'react'
import { getAttachmentUrl } from '@/services/attachmentService'

/** 附件下载 Hook */
export function useAttachment() {
  const download = useCallback(
    (attachmentId: string, emailConfigId: string, uid: string) => {
      const url = getAttachmentUrl(attachmentId, emailConfigId, uid)
      window.open(url, '_blank')
    },
    [],
  )

  const getPreviewUrl = useCallback(
    (attachmentId: string, emailConfigId: string, uid: string) => {
      return getAttachmentUrl(attachmentId, emailConfigId, uid)
    },
    [],
  )

  return { download, getPreviewUrl }
}
