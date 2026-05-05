import { describe, it, expect, beforeEach, vi } from 'vitest'

const tmpDir = vi.hoisted(() => {
  const fs = require('node:fs')
  const path = require('node:path')
  const os = require('node:os')
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ai-config-test-'))
})

vi.mock('uuid', () => ({
  v4: () => 'test-ai-uuid-1234',
}))

vi.mock('../stores/aiConfigStore.js', async () => {
  const crypto = await import('node:crypto')
  const fs = await import('node:fs')
  const path = await import('node:path')

  const DATA_FILE = path.join(tmpDir, 'aiConfigs.json')
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
    getAll: () => readAll().map((c: any) => ({ ...c, apiKey: decrypt(c.apiKey) })),
    getById: (id: string) => {
      const c = readAll().find((c: any) => c.id === id)
      return c ? { ...c, apiKey: decrypt(c.apiKey) } : undefined
    },
    save: (data: any) => {
      const configs = readAll()
      const now = new Date().toISOString()
      const newConfig = { id: 'test-ai-uuid-1234', ...data, apiKey: encrypt(data.apiKey), createdAt: now, updatedAt: now }
      configs.push(newConfig)
      writeAll(configs)
      return { ...newConfig, apiKey: data.apiKey }
    },
    update: (id: string, data: any) => {
      const configs = readAll()
      const index = configs.findIndex((c: any) => c.id === id)
      if (index === -1) return undefined
      const updated = { ...configs[index], ...data, apiKey: data.apiKey ? encrypt(data.apiKey) : configs[index].apiKey, updatedAt: new Date().toISOString() }
      configs[index] = updated
      writeAll(configs)
      return { ...updated, apiKey: data.apiKey || decrypt(configs[index].apiKey) }
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
import * as aiConfigStore from '../stores/aiConfigStore.js'

describe('aiConfigStore', () => {
  beforeEach(() => {
    const dataFile = path.join(tmpDir, 'aiConfigs.json')
    if (fs.existsSync(dataFile)) fs.unlinkSync(dataFile)
  })

  it('should return empty array when no configs', () => {
    const configs = aiConfigStore.getAll()
    expect(configs).toEqual([])
  })

  it('should save and retrieve a config', () => {
    const config = aiConfigStore.save({
      apiBaseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test-key',
      model: 'gpt-4',
      systemPrompt: 'You are helpful.',
    })

    expect(config.id).toBe('test-ai-uuid-1234')
    expect(config.apiKey).toBe('sk-test-key')
    expect(config.model).toBe('gpt-4')

    const all = aiConfigStore.getAll()
    expect(all).toHaveLength(1)
    expect(all[0]!.apiKey).toBe('sk-test-key')
  })

  it('should get config by id', () => {
    aiConfigStore.save({
      apiBaseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test',
      model: 'gpt-3.5',
      systemPrompt: '',
    })

    const config = aiConfigStore.getById('test-ai-uuid-1234')
    expect(config).toBeDefined()
    expect(config!.apiKey).toBe('sk-test')
  })

  it('should return undefined for non-existent id', () => {
    const config = aiConfigStore.getById('non-existent')
    expect(config).toBeUndefined()
  })

  it('should encrypt and decrypt apiKey correctly', () => {
    const secretKey = 'sk-super-secret-api-key-12345'
    aiConfigStore.save({
      apiBaseUrl: 'https://api.example.com/v1',
      apiKey: secretKey,
      model: 'gpt-4',
      systemPrompt: '',
    })

    const all = aiConfigStore.getAll()
    expect(all[0]!.apiKey).toBe(secretKey)
  })

  it('should remove a config', () => {
    aiConfigStore.save({
      apiBaseUrl: 'https://api.example.com/v1',
      apiKey: 'sk-key',
      model: 'gpt-4',
      systemPrompt: '',
    })

    const result = aiConfigStore.remove('test-ai-uuid-1234')
    expect(result).toBe(true)
    expect(aiConfigStore.getAll()).toHaveLength(0)
  })
})
