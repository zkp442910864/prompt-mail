import { useEffect } from 'react'
import { Card, Form, Input, Button, Space, message, Tooltip } from 'antd'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  CodeOutlined,
} from '@ant-design/icons'
import { useAiConfig, useSaveAiConfig, useTestAiConnection } from '../../hooks/useAiConfig'
import type { CreateAIConfig } from '@/types/aiConfig'

export default function AiConfigCard() {
  const [form] = Form.useForm<CreateAIConfig>()
  const { data: aiConfigs } = useAiConfig()
  const saveMutation = useSaveAiConfig()
  const testMutation = useTestAiConnection()

  const promptEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '你是一个专业的邮件回复助手，请用礼貌、专业的语气回复邮件。',
      }),
    ],
    content: '',
  })

  // 加载已有配置
  useEffect(() => {
    if (aiConfigs && aiConfigs.length > 0) {
      const config = aiConfigs[0]!
      form.setFieldsValue({
        apiBaseUrl: config.apiBaseUrl,
        apiKey: config.apiKey,
        model: config.model,
      })
      // 设置富文本编辑器内容
      if (config.systemPrompt && promptEditor) {
        promptEditor.commands.setContent(config.systemPrompt)
      }
    }
  }, [aiConfigs, form, promptEditor])

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
      const systemPrompt = promptEditor?.getHTML() || ''
      saveMutation.mutate({
        ...values,
        systemPrompt,
      })
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

        {/* 通用提示词 - 富文本编辑器 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">通用提示词</label>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* 工具栏 */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
              <Tooltip title="加粗">
                <Button
                  type="text"
                  size="small"
                  icon={<BoldOutlined />}
                  className={promptEditor?.isActive('bold') ? '!bg-blue-100 !text-blue-600' : ''}
                  onClick={() => promptEditor?.chain().focus().toggleBold().run()}
                />
              </Tooltip>
              <Tooltip title="斜体">
                <Button
                  type="text"
                  size="small"
                  icon={<ItalicOutlined />}
                  className={promptEditor?.isActive('italic') ? '!bg-blue-100 !text-blue-600' : ''}
                  onClick={() => promptEditor?.chain().focus().toggleItalic().run()}
                />
              </Tooltip>
              <Tooltip title="代码">
                <Button
                  type="text"
                  size="small"
                  icon={<CodeOutlined />}
                  className={promptEditor?.isActive('code') ? '!bg-blue-100 !text-blue-600' : ''}
                  onClick={() => promptEditor?.chain().focus().toggleCode().run()}
                />
              </Tooltip>
              <Tooltip title="有序列表">
                <Button
                  type="text"
                  size="small"
                  icon={<OrderedListOutlined />}
                  className={promptEditor?.isActive('orderedList') ? '!bg-blue-100 !text-blue-600' : ''}
                  onClick={() => promptEditor?.chain().focus().toggleOrderedList().run()}
                />
              </Tooltip>
              <Tooltip title="无序列表">
                <Button
                  type="text"
                  size="small"
                  icon={<UnorderedListOutlined />}
                  className={promptEditor?.isActive('bulletList') ? '!bg-blue-100 !text-blue-600' : ''}
                  onClick={() => promptEditor?.chain().focus().toggleBulletList().run()}
                />
              </Tooltip>
            </div>
            {/* 编辑器内容 */}
            <div className="min-h-[120px] max-h-[240px] overflow-auto">
              <div className="p-3">
                <EditorContent editor={promptEditor} className="tiptap-prompt-editor" />
              </div>
            </div>
          </div>
        </div>

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
