import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import cors from 'cors'

// Mock external services before importing controllers
vi.mock('../services/imapService.js', () => ({
  testConnection: vi.fn().mockResolvedValue(true),
  fetchMailList: vi.fn().mockResolvedValue([
    {
      id: '1',
      subject: 'Test Mail',
      from: { name: 'Sender', address: 'sender@test.com' },
      date: new Date().toISOString(),
      isRead: false,
      hasAttachments: false,
      snippet: 'Test',
    },
  ]),
  fetchMailDetail: vi.fn().mockResolvedValue({
    id: '1',
    subject: 'Test Mail',
    from: { name: 'Sender', address: 'sender@test.com' },
    to: [{ name: '', address: 'me@test.com' }],
    cc: [],
    date: new Date().toISOString(),
    messageId: '<msg1@test.com>',
    text: 'Hello',
    html: '<p>Hello</p>',
    attachments: [],
  }),
  markAsRead: vi.fn().mockResolvedValue(undefined),
  fetchAttachment: vi.fn().mockResolvedValue(Buffer.from('fake-attachment')),
}))

vi.mock('../services/smtpService.js', () => ({
  testConnection: vi.fn().mockResolvedValue(true),
  sendMail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../services/aiService.js', () => ({
  testConnection: vi.fn().mockResolvedValue({ success: true, message: '连接成功' }),
  generateReply: vi.fn().mockResolvedValue({ content: 'AI generated reply' }),
}))

vi.mock('../services/attachmentService.js', () => ({
  fetchAttachment: vi.fn().mockResolvedValue({
    buffer: Buffer.from('fake-attachment'),
    filename: 'test.pdf',
    contentType: 'application/pdf',
  }),
}))

// Mock stores with in-memory data
const emailConfigs: any[] = []
const aiConfigs: any[] = []

vi.mock('../stores/emailConfigStore.js', () => ({
  getAll: () => emailConfigs.map((c) => ({ ...c, authCode: 'decrypted' })),
  getById: (id: string) => {
    const c = emailConfigs.find((c) => c.id === id)
    return c ? { ...c, authCode: 'decrypted' } : undefined
  },
  save: (data: any) => {
    const config = { id: 'email-1', ...data, authCode: 'encrypted', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    emailConfigs.push(config)
    return { ...config, authCode: data.authCode }
  },
}))

vi.mock('../stores/aiConfigStore.js', () => ({
  getAll: () => aiConfigs.map((c) => ({ ...c, apiKey: 'decrypted' })),
  getById: (id: string) => {
    const c = aiConfigs.find((c) => c.id === id)
    return c ? { ...c, apiKey: 'decrypted' } : undefined
  },
  save: (data: any) => {
    const config = { id: 'ai-1', ...data, apiKey: 'encrypted', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    aiConfigs.push(config)
    return { ...config, apiKey: data.apiKey }
  },
}))

vi.mock('../middlewares/requestLogger.js', () => ({
  requestLogger: (_req: any, _res: any, next: any) => next(),
}))

vi.mock('../middlewares/errorHandler.js', () => ({
  errorHandler: (err: Error, _req: any, res: any, _next: any) => {
    res.status(500).json({ code: 500, message: `服务器内部错误: ${err.message}`, data: null })
  },
}))

import { registerRoutes } from '../routes/index.js'

function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json())
  registerRoutes(app)
  return app
}

describe('API Integration Tests', () => {
  let app: express.Express

  beforeEach(() => {
    emailConfigs.length = 0
    aiConfigs.length = 0
    app = createApp()
  })

  // Email Config
  describe('GET /api/config/email', () => {
    it('should return empty array when no configs', async () => {
      const res = await request(app).get('/api/config/email')
      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data).toEqual([])
    })
  })

  describe('POST /api/config/email', () => {
    it('should save a new email config', async () => {
      const res = await request(app)
        .post('/api/config/email')
        .send({
          type: 'aliyun',
          imapHost: 'imap.aliyun.com',
          imapPort: 993,
          smtpHost: 'smtp.aliyun.com',
          smtpPort: 465,
          account: 'test@aliyun.com',
          authCode: 'secret123',
        })
      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.account).toBe('test@aliyun.com')
    })

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/api/config/email')
        .send({ type: 'aliyun' })
      expect(res.body.code).toBe(400)
    })

    it('should fail with invalid type', async () => {
      const res = await request(app)
        .post('/api/config/email')
        .send({
          type: 'gmail',
          imapHost: 'imap.gmail.com',
          imapPort: 993,
          smtpHost: 'smtp.gmail.com',
          smtpPort: 465,
          account: 'test@gmail.com',
          authCode: 'secret',
        })
      expect(res.body.code).toBe(400)
    })
  })

  describe('POST /api/config/email/test', () => {
    it('should test email connection', async () => {
      const res = await request(app)
        .post('/api/config/email/test')
        .send({
          imapHost: 'imap.aliyun.com',
          imapPort: 993,
          smtpHost: 'smtp.aliyun.com',
          smtpPort: 465,
          account: 'test@aliyun.com',
          authCode: 'secret',
        })
      expect(res.status).toBe(200)
      expect(res.body.data.imap).toBe(true)
      expect(res.body.data.smtp).toBe(true)
    })

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/api/config/email/test')
        .send({})
      expect(res.body.code).toBe(400)
    })
  })

  // AI Config
  describe('GET /api/config/ai', () => {
    it('should return empty array when no configs', async () => {
      const res = await request(app).get('/api/config/ai')
      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data).toEqual([])
    })
  })

  describe('POST /api/config/ai', () => {
    it('should save a new AI config', async () => {
      const res = await request(app)
        .post('/api/config/ai')
        .send({
          apiBaseUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-test',
          model: 'gpt-4',
          systemPrompt: 'Be helpful',
        })
      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.model).toBe('gpt-4')
    })

    it('should fail with missing required fields', async () => {
      const res = await request(app)
        .post('/api/config/ai')
        .send({ apiBaseUrl: 'https://api.openai.com/v1' })
      expect(res.body.code).toBe(400)
    })
  })

  describe('POST /api/config/ai/test', () => {
    it('should test AI connection', async () => {
      const res = await request(app)
        .post('/api/config/ai/test')
        .send({
          apiBaseUrl: 'https://api.openai.com/v1',
          apiKey: 'sk-test',
          model: 'gpt-4',
        })
      expect(res.status).toBe(200)
      expect(res.body.data.success).toBe(true)
    })

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/api/config/ai/test')
        .send({})
      expect(res.body.code).toBe(400)
    })
  })

  // Mail
  describe('GET /api/mail/list', () => {
    it('should return mail list with valid config', async () => {
      // Add an email config first
      emailConfigs.push({
        id: 'email-1',
        type: 'aliyun',
        imapHost: 'imap.aliyun.com',
        imapPort: 993,
        smtpHost: 'smtp.aliyun.com',
        smtpPort: 465,
        account: 'test@aliyun.com',
        authCode: 'encrypted',
      })

      const res = await request(app)
        .get('/api/mail/list?emailConfigId=email-1')
      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data).toHaveLength(1)
    })

    it('should fail without emailConfigId', async () => {
      const res = await request(app).get('/api/mail/list')
      expect(res.body.code).toBe(400)
    })

    it('should fail with non-existent config', async () => {
      const res = await request(app)
        .get('/api/mail/list?emailConfigId=nonexistent')
      expect(res.body.code).toBe(404)
    })
  })

  describe('GET /api/mail/:id', () => {
    it('should return mail detail', async () => {
      emailConfigs.push({
        id: 'email-1',
        type: 'aliyun',
        imapHost: 'imap.aliyun.com',
        imapPort: 993,
        smtpHost: 'smtp.aliyun.com',
        smtpPort: 465,
        account: 'test@aliyun.com',
        authCode: 'encrypted',
      })

      const res = await request(app)
        .get('/api/mail/1?emailConfigId=email-1')
      expect(res.status).toBe(200)
      expect(res.body.code).toBe(0)
      expect(res.body.data.subject).toBe('Test Mail')
    })

    it('should fail without id or emailConfigId', async () => {
      const res = await request(app).get('/api/mail/1')
      expect(res.body.code).toBe(400)
    })
  })

  describe('POST /api/mail/reply', () => {
    it('should send reply', async () => {
      emailConfigs.push({
        id: 'email-1',
        type: 'aliyun',
        imapHost: 'imap.aliyun.com',
        imapPort: 993,
        smtpHost: 'smtp.aliyun.com',
        smtpPort: 465,
        account: 'test@aliyun.com',
        authCode: 'encrypted',
      })

      const res = await request(app)
        .post('/api/mail/reply')
        .send({
          emailConfigId: 'email-1',
          to: ['recipient@test.com'],
          subject: 'Re: Test',
          body: '<p>Reply</p>',
        })
      expect(res.status).toBe(200)
      expect(res.body.data.success).toBe(true)
    })

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/api/mail/reply')
        .send({ emailConfigId: 'email-1' })
      expect(res.body.code).toBe(400)
    })
  })

  describe('PATCH /api/mail/:id/read', () => {
    it('should mark mail as read', async () => {
      emailConfigs.push({
        id: 'email-1',
        type: 'aliyun',
        imapHost: 'imap.aliyun.com',
        imapPort: 993,
        smtpHost: 'smtp.aliyun.com',
        smtpPort: 465,
        account: 'test@aliyun.com',
        authCode: 'encrypted',
      })

      const res = await request(app)
        .patch('/api/mail/1/read?emailConfigId=email-1')
      expect(res.status).toBe(200)
      expect(res.body.data.success).toBe(true)
    })

    it('should fail without id or emailConfigId', async () => {
      const res = await request(app).patch('/api/mail/1/read')
      expect(res.body.code).toBe(400)
    })
  })

  // Attachment
  describe('GET /api/attachment/:id', () => {
    it('should fail without required params', async () => {
      const res = await request(app).get('/api/attachment/some-id')
      expect(res.body.code).toBe(400)
    })

    it('should fail with non-existent config', async () => {
      const res = await request(app)
        .get('/api/attachment/some-id?emailConfigId=nonexistent&uid=1')
      expect(res.body.code).toBe(404)
    })
  })

  // AI Generate
  describe('POST /api/ai/generate', () => {
    it('should generate AI reply', async () => {
      aiConfigs.push({
        id: 'ai-1',
        apiBaseUrl: 'https://api.openai.com/v1',
        apiKey: 'encrypted',
        model: 'gpt-4',
        systemPrompt: '',
      })

      const res = await request(app)
        .post('/api/ai/generate')
        .send({
          subject: 'Test Subject',
          from: 'sender@test.com',
          body: 'Hello',
        })
      expect(res.status).toBe(200)
      expect(res.body.data.content).toBe('AI generated reply')
    })

    it('should fail without required fields', async () => {
      const res = await request(app)
        .post('/api/ai/generate')
        .send({ subject: 'Test' })
      expect(res.body.code).toBe(400)
    })

    it('should fail when no AI config exists', async () => {
      const res = await request(app)
        .post('/api/ai/generate')
        .send({
          subject: 'Test',
          from: 'a@b.com',
          body: 'Hello',
        })
      expect(res.body.code).toBe(400)
      expect(res.body.message).toContain('AI')
    })
  })
})
