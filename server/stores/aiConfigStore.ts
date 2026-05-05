import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'
import type { AIConfig, CreateAIConfig } from '../types/index.js'

const DATA_FILE = path.resolve(import.meta.dirname, '../data/aiConfigs.json')
const ENCRYPT_KEY = process.env.ENCRYPT_KEY || 'J4nGgGFl4nq7P8j9'
const IV_LENGTH = 16

/** AES 加密 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = crypto.createHash('sha256').update(ENCRYPT_KEY).digest()
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

/** AES 解密 */
function decrypt(text: string): string {
  const parts = text.split(':')
  const iv = Buffer.from(parts[0]!, 'hex')
  const key = crypto.createHash('sha256').update(ENCRYPT_KEY).digest()
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  let decrypted = decipher.update(parts[1]!, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/** 读取所有 AI 配置 */
function readAll(): AIConfig[] {
  if (!fs.existsSync(DATA_FILE)) {
    return []
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8')
  return JSON.parse(raw) as AIConfig[]
}

/** 写入所有 AI 配置 */
function writeAll(configs: AIConfig[]): void {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(configs, null, 2), 'utf-8')
}

/** 获取所有 AI 配置（解密 apiKey） */
export function getAll(): AIConfig[] {
  return readAll().map((config) => ({
    ...config,
    apiKey: decrypt(config.apiKey),
  }))
}

/** 根据 ID 获取 AI 配置 */
export function getById(id: string): AIConfig | undefined {
  const config = readAll().find((c) => c.id === id)
  if (!config) return undefined
  return { ...config, apiKey: decrypt(config.apiKey) }
}

/** 保存 AI 配置 */
export function save(data: CreateAIConfig): AIConfig {
  const configs = readAll()
  const now = new Date().toISOString()
  const newConfig: AIConfig = {
    id: uuidv4(),
    ...data,
    apiKey: encrypt(data.apiKey),
    createdAt: now,
    updatedAt: now,
  }
  configs.push(newConfig)
  writeAll(configs)
  return { ...newConfig, apiKey: data.apiKey }
}

/** 更新 AI 配置 */
export function update(id: string, data: Partial<CreateAIConfig>): AIConfig | undefined {
  const configs = readAll()
  const index = configs.findIndex((c) => c.id === id)
  if (index === -1) return undefined

  const updated = {
    ...configs[index]!,
    ...data,
    apiKey: data.apiKey ? encrypt(data.apiKey) : configs[index]!.apiKey,
    updatedAt: new Date().toISOString(),
  }
  configs[index] = updated
  writeAll(configs)
  return { ...updated, apiKey: data.apiKey || decrypt(configs[index]!.apiKey) }
}

/** 删除 AI 配置 */
export function remove(id: string): boolean {
  const configs = readAll()
  const index = configs.findIndex((c) => c.id === id)
  if (index === -1) return false
  configs.splice(index, 1)
  writeAll(configs)
  return true
}
