import { Router } from 'express'
import * as emailConfigController from '../controllers/emailConfigController.js'
import * as aiConfigController from '../controllers/aiConfigController.js'
import * as mailController from '../controllers/mailController.js'
import * as attachmentController from '../controllers/attachmentController.js'
import * as aiController from '../controllers/aiController.js'

const emailConfigRoutes = Router()
emailConfigRoutes.get('/', emailConfigController.getEmailConfig)
emailConfigRoutes.post('/', emailConfigController.saveEmailConfig)
emailConfigRoutes.post('/test', emailConfigController.testEmailConnection)

const aiConfigRoutes = Router()
aiConfigRoutes.get('/', aiConfigController.getAiConfig)
aiConfigRoutes.post('/', aiConfigController.saveAiConfig)
aiConfigRoutes.post('/test', aiConfigController.testAiConnection)

const mailRoutes = Router()
mailRoutes.get('/list', mailController.getMailList)
mailRoutes.get('/:id', mailController.getMailDetail)
mailRoutes.post('/reply', mailController.replyMail)
mailRoutes.patch('/:id/read', mailController.markAsRead)

const attachmentRoutes = Router()
attachmentRoutes.get('/:id', attachmentController.downloadAttachment)

const aiRoutes = Router()
aiRoutes.post('/generate', aiController.generateReply)
aiRoutes.post('/translate', aiController.translateToChinese)

/** 注册所有路由 */
export function registerRoutes(app: import('express').Express) {
  app.use('/api/config/email', emailConfigRoutes)
  app.use('/api/config/ai', aiConfigRoutes)
  app.use('/api/mail', mailRoutes)
  app.use('/api/attachment', attachmentRoutes)
  app.use('/api/ai', aiRoutes)
}
