export interface AIConfig {
  id: string
  apiBaseUrl: string
  apiKey: string
  model: string
  systemPrompt: string
  createdAt: string
  updatedAt: string
}

export type CreateAIConfig = Omit<AIConfig, 'id' | 'createdAt' | 'updatedAt'>
