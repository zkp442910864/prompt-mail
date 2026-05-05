import type { Request, Response } from 'express'
import * as emailConfigStore from '../stores/emailConfigStore.js'
import * as attachmentService from '../services/attachmentService.js'
import { fail, error } from '../utils/response.js'

/** 获取参数中的字符串值 */
function getStr(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return undefined
}

/** 下载/查看附件 */
export async function downloadAttachment(req: Request, res: Response) {
  const attachmentId = getStr(req.params.id)
  const emailConfigId = getStr(req.query.emailConfigId)
  const uid = getStr(req.query.uid)

  if (!attachmentId || !emailConfigId || !uid) {
    fail(res, '参数校验失败：id、emailConfigId、uid 不能为空', 400)
    return
  }

  const config = emailConfigStore.getById(emailConfigId)
  if (!config) {
    fail(res, '邮箱配置不存在', 404)
    return
  }

  try {
    const { buffer, filename, contentType } = await attachmentService.fetchAttachment(
      config,
      uid,
      attachmentId,
    )

    // 判断是否可以在线预览
    const previewTypes = [
      'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp',
      'application/pdf', 'text/plain', 'text/html', 'text/csv',
    ]

    if (previewTypes.includes(contentType)) {
      // 在线预览
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Length', buffer.length)
      res.send(buffer)
    } else {
      // 下载
      res.setHeader('Content-Type', 'application/octet-stream')
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
      res.setHeader('Content-Length', buffer.length)
      res.send(buffer)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取附件失败'
    error(res, message, 404)
  }
}
