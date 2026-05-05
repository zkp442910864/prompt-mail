import type { Request, Response } from 'express'
import * as emailConfigStore from '../stores/emailConfigStore.js'
import * as imapService from '../services/imapService.js'
import * as smtpService from '../services/smtpService.js'
import { success, fail } from '../utils/response.js'

/** 获取邮箱配置列表 */
export async function getEmailConfig(_req: Request, res: Response) {
  const configs = emailConfigStore.getAll()
  success(res, configs, '获取成功')
}

/** 保存邮箱配置 */
export async function saveEmailConfig(req: Request, res: Response) {
  const { type, imapHost, imapPort, smtpHost, smtpPort, account, authCode } = req.body

  if (!type || !imapHost || !imapPort || !smtpHost || !smtpPort || !account || !authCode) {
    fail(res, '参数校验失败：所有字段不能为空', 400)
    return
  }

  const validTypes = ['aliyun', 'aliyun-enterprise', 'qq', 'custom']
  if (!validTypes.includes(type)) {
    fail(res, `参数校验失败：type 必须为 ${validTypes.join(' / ')}`, 400)
    return
  }

  const config = emailConfigStore.save({
    type,
    imapHost,
    imapPort,
    smtpHost,
    smtpPort,
    account,
    authCode,
  })
  success(res, config, '保存成功')
}

/** 测试邮箱连接 */
export async function testEmailConnection(req: Request, res: Response) {
  const { imapHost, imapPort, smtpHost, smtpPort, account, authCode } = req.body

  if (!imapHost || !imapPort || !smtpHost || !smtpPort || !account || !authCode) {
    fail(res, '参数校验失败：所有字段不能为空', 400)
    return
  }

  const config = {
    id: '',
    type: 'aliyun' as const,
    imapHost,
    imapPort,
    smtpHost,
    smtpPort,
    account,
    authCode,
    createdAt: '',
    updatedAt: '',
  }

  const [imapOk, smtpOk] = await Promise.allSettled([
    imapService.testConnection(config),
    smtpService.testConnection(config),
  ])

  success(res, {
    imap: imapOk.status === 'fulfilled' && imapOk.value,
    smtp: smtpOk.status === 'fulfilled' && smtpOk.value,
  }, '测试完成')
}
