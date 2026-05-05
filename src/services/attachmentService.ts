/** 获取附件下载 URL */
export function getAttachmentUrl(id: string, emailConfigId: string, uid: string): string {
  return `/api/attachment/${id}?emailConfigId=${encodeURIComponent(emailConfigId)}&uid=${encodeURIComponent(uid)}`
}
