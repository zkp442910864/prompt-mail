import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { registerRoutes } from './routes/index.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { requestLogger } from './middlewares/requestLogger.js'
import * as emailConfigStore from './stores/emailConfigStore.js'
import * as aiConfigStore from './stores/aiConfigStore.js'

// 加载 .env 配置
dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3001

// 中间件
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(requestLogger)

// 注册路由
registerRoutes(app)

// 全局错误处理
app.use(errorHandler)

/** 初始化默认数据（若为空则写入一份示例配置） */
function initDefaultData() {
  const emailConfigs = emailConfigStore.getAll()
  if (emailConfigs.length === 0) {
    emailConfigStore.save({
      type: 'aliyun-enterprise',
      imapHost: 'imap.qiye.aliyun.com',
      imapPort: 993,
      smtpHost: 'smtp.qiye.aliyun.com',
      smtpPort: 465,
      account: 'your-account@example.com',
      authCode: 'your-auth-code',
    })
    console.log('[Prompt-Mail] 已初始化默认邮箱配置（阿里企业邮箱），请在设置页面修改')
  }

  const aiConfigs = aiConfigStore.getAll()
  if (aiConfigs.length === 0) {
    aiConfigStore.save({
      apiBaseUrl: 'https://api.openai.com/v1',
      apiKey: 'your-api-key',
      model: 'gpt-4o',
      systemPrompt: '你是一个专业的邮件回复助手，请用礼貌、专业的语气回复邮件。',
    })
    console.log('[Prompt-Mail] 已初始化默认 AI 配置，请在设置页面修改')
  }
}

app.listen(PORT, () => {
  initDefaultData()
  console.log(`[Prompt-Mail] 后端服务已启动: http://localhost:${PORT}`)
})
