import { describe, it, expect, beforeEach, vi } from 'vitest'

// vi.hoisted 无法访问 import，所以用 Node 内置模块路径
const tmpDir = vi.hoisted(() => {
  const fs = require('node:fs')
  const path = require('node:path')
  const os = require('node:os')
  return fs.mkdtempSync(path.join(os.tmpdir(), 'email-config-test-'))
})

vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}))

vi.mock('../stores/emailConfigStore.js', async () => {
  const crypto = await import('node:crypto')
  const fs = await import('node:fs')
  const path = await import('node:path')

  const DATA_FILE = path.join(tmpDir, 'emailConfigs.json')
  const ENCRYPT_KEY = 'prompt-mail-2026-secret-key'
  const IV_LENGTH = 16

  function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH)
    const key = crypto.createHash('sha256').update(ENCRYPT_KEY).digest()
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
  }

  function decrypt(text: string): string {
    const parts = text.split(':')
    const iv = Buffer.from(parts[0]!, 'hex')
    const key = crypto.createHash('sha256').update(ENCRYPT_KEY).digest()
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(parts[1]!, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  function readAll() {
    if (!fs.existsSync(DATA_FILE)) return []
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  }

  function writeAll(configs: unknown[]) {
    const dir = path.dirname(DATA_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(configs, null, 2), 'utf-8')
  }

  return {
    getAll: () => readAll().map((c: any) => ({ ...c, authCode: decrypt(c.authCode) })),
    getById: (id: string) => {
      const c = readAll().find((c: any) => c.id === id)
      return c ? { ...c, authCode: decrypt(c.authCode) } : undefined
    },
    save: (data: any) => {
      const configs = readAll()
      const now = new Date().toISOString()
      const newConfig = { id: 'test-uuid-1234', ...data, authCode: encrypt(data.authCode), createdAt: now, updatedAt: now }
      configs.push(newConfig)
      writeAll(configs)
      return { ...newConfig, authCode: data.authCode }
    },
    update: (id: string, data: any) => {
      const configs = readAll()
      const index = configs.findIndex((c: any) => c.id === id)
      if (index === -1) return undefined
      const updated = { ...configs[index], ...data, authCode: data.authCode ? encrypt(data.authCode) : configs[index].authCode, updatedAt: new Date().toISOString() }
      configs[index] = updated
      writeAll(configs)
      return { ...updated, authCode: data.authCode || decrypt(configs[index].authCode) }
    },
    remove: (id: string) => {
      const configs = readAll()
      const index = configs.findIndex((c: any) => c.id === id)
      if (index === -1) return false
      configs.splice(index, 1)
      writeAll(configs)
      return true
    },
  }
})

import fs from 'node:fs'
import path from 'node:path'
import * as emailConfigStore from '../stores/emailConfigStore.js'

describe('emailConfigStore', () => {
  beforeEach(() => {
    const dataFile = path.join(tmpDir, 'emailConfigs.json')
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile)
  })

  it('should return empty array when no configs', () => {
    const configs = emailConfigStore.getAll()
    expect(configs).toEqual([])
  })

  it('should save and retrieve a config', () => {
    const config = emailConfigStore.save({
      type: 'aliyun',
      imapHost: 'imap.aliyun.com',
      imapPort: 993,
      smtpHost: 'smtp.aliyun.com',
      smtpPort: 465,
      account: 'test@aliyun.com',
      authCode: 'my-secret-code',
    })

    expect(config.id).toBe('test-uuid-1234')
    expect(config.account).toBe('test@aliyun.com')
    expect(config.authCode).toBe('my-secret-code')

    const all = emailConfigStore.getAll()
    expect(all).toHaveLength(1)
    expect(all[0]!.authCode).toBe('my-secret-code')
  })

  it('should get config by id', () => {
    emailConfigStore.save({
      type: 'qq',
      imapHost: 'imap.qq.com',
      imapPort: 993,
      smtpHost: 'smtp.qq.com',
      smtpPort: 465,
      account: 'test@qq.com',
      authCode: 'qq-auth-code',
    })

    const config = emailConfigStore.getById('test-uuid-1234')
    expect(config).toBeDefined()
    expect(config!.account).toBe('test@qq.com')
    expect(config!.authCode).toBe('qq-auth-code')
  })

  it('should return undefined for non-existent id', () => {
    const config = emailConfigStore.getById('non-existent')
    expect(config).toBeUndefined()
  })

  it('should encrypt and decrypt authCode correctly', () => {
    const secret = 'my-super-secret-password'
    emailConfigStore.save({
      type: 'aliyun',
      imapHost: 'imap.aliyun.com',
      imapPort: 993,
      smtpHost: 'smtp.aliyun.com',
      smtpPort: 465,
      account: 'test@aliyun.com',
      authCode: secret,
    })

    const all = emailConfigStore.getAll()
    expect(all[0]!.authCode).toBe(secret)
  })

  it('should remove a config', () => {
    emailConfigStore.save({
      type: 'aliyun',
      imapHost: 'imap.aliyun.com',
      imapPort: 993,
      smtpHost: 'smtp.aliyun.com',
      smtpPort: 465,
      account: 'test@aliyun.com',
      authCode: 'code',
    })

    const result = emailConfigStore.remove('test-uuid-1234')
    expect(result).toBe(true)
    expect(emailConfigStore.getAll()).toHaveLength(0)
  })

  it('should return false when removing non-existent config', () => {
    const result = emailConfigStore.remove('non-existent')
    expect(result).toBe(false)
  })
})
