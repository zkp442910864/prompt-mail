import { useEffect } from 'react'
import { Card, Form, Input, Button, Space, message } from 'antd'
import { useAiConfig, useSaveAiConfig, useTestAiConnection } from '../../hooks/useAiConfig'
import type { CreateAIConfig } from '@/types/aiConfig'

export default function AiConfigCard() {
  const [form] = Form.useForm<CreateAIConfig>()
  const { data: aiConfigs } = useAiConfig()
  const saveMutation = useSaveAiConfig()
  const testMutation = useTestAiConnection()

  // 加载已有配置
  useEffect(() => {
    if (aiConfigs && aiConfigs.length > 0) {
      const config = aiConfigs[0]!
      form.setFieldsValue({
        apiBaseUrl: config.apiBaseUrl,
        apiKey: config.apiKey,
        model: config.model,
        systemPrompt: config.systemPrompt,
      })
    }
  }, [aiConfigs, form])

  // 测试连接
  const handleTest = async () => {
    try {
      const values = await form.validateFields(['apiBaseUrl', 'apiKey', 'model'])
      testMutation.mutate({
        apiBaseUrl: values.apiBaseUrl,
        apiKey: values.apiKey,
        model: values.model,
      })
    } catch {
      message.warning('请填写 API 地址、API Key 和模型名称')
    }
  }

  // 保存配置
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      saveMutation.mutate(values)
    } catch {
      message.warning('请填写完整的配置信息')
    }
  }

  return (
    <Card title="AI 配置" className="w-full">
      <Form form={form} layout="vertical" className="max-w-md">
        <Form.Item
          name="apiBaseUrl"
          label="API 地址"
          rules={[{ required: true, message: '请输入 API 地址' }]}
        >
          <Input placeholder="https://api.openai.com/v1" />
        </Form.Item>

        <Form.Item
          name="apiKey"
          label="API Key"
          rules={[{ required: true, message: '请输入 API Key' }]}
        >
          <Input.Password placeholder="sk-xxxxxxxxxxxx" />
        </Form.Item>

        <Form.Item
          name="model"
          label="模型名称"
          rules={[{ required: true, message: '请输入模型名称' }]}
        >
          <Input placeholder="gpt-4o" />
        </Form.Item>

        <Form.Item name="systemPrompt" label="通用提示词">
          <Input.TextArea
            rows={4}
            placeholder="你是一个专业的邮件回复助手，请用礼貌、专业的语气回复邮件。"
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button onClick={handleTest} loading={testMutation.isPending}>
              测试连接
            </Button>
            <Button type="primary" onClick={handleSave} loading={saveMutation.isPending}>
              保存配置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
