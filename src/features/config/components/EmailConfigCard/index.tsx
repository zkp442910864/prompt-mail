import { useState, useEffect } from 'react'
import { Card, Form, Select, Input, Button, Space, message } from 'antd'
import { useEmailConfig, useSaveEmailConfig, useTestEmailConnection } from '../../hooks/useEmailConfig'
import { EMAIL_PRESETS } from '@/utils/emailPresets'
import type { CreateEmailConfig } from '@/types/emailConfig'

/** 邮箱类型选项 */
const EMAIL_TYPE_OPTIONS = [
  { label: '阿里个人邮箱', value: 'aliyun' },
  { label: '阿里企业邮箱', value: 'aliyun-enterprise' },
  { label: 'QQ邮箱', value: 'qq' },
  { label: '自定义', value: 'custom' },
]

export default function EmailConfigCard() {
  const [form] = Form.useForm<CreateEmailConfig>()
  const [emailType, setEmailType] = useState<string>('')
  const { data: emailConfigs } = useEmailConfig()
  const saveMutation = useSaveEmailConfig()
  const testMutation = useTestEmailConnection()

  // 是否为自定义模式（手动填写 IMAP/SMTP）
  const isCustom = emailType === 'custom'

  // 加载已有配置
  useEffect(() => {
    if (emailConfigs && emailConfigs.length > 0) {
      const config = emailConfigs[0]!
      form.setFieldsValue({
        type: config.type,
        imapHost: config.imapHost,
        imapPort: config.imapPort,
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        account: config.account,
        authCode: config.authCode,
      })
      setEmailType(config.type)
    }
  }, [emailConfigs, form])

  // 邮箱类型切换时自动填充
  const handleTypeChange = (type: string) => {
    setEmailType(type)
    const preset = EMAIL_PRESETS[type]
    if (preset) {
      form.setFieldsValue({
        type: type as CreateEmailConfig['type'],
        imapHost: preset.imapHost,
        imapPort: preset.imapPort,
        smtpHost: preset.smtpHost,
        smtpPort: preset.smtpPort,
      })
    }
  }

  // 测试连接
  const handleTest = async () => {
    try {
      const values = await form.validateFields()
      testMutation.mutate({
        imapHost: values.imapHost,
        imapPort: values.imapPort,
        smtpHost: values.smtpHost,
        smtpPort: values.smtpPort,
        account: values.account,
        authCode: values.authCode,
      })
    } catch {
      message.warning('请填写完整的配置信息')
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
    <Card title="邮箱配置" className="w-full">
      <Form form={form} layout="vertical" className="max-w-md">
        <Form.Item name="type" label="邮箱类型" rules={[{ required: true, message: '请选择邮箱类型' }]}>
          <Select
            placeholder="请选择邮箱类型"
            onChange={handleTypeChange}
            options={EMAIL_TYPE_OPTIONS}
          />
        </Form.Item>

        <Form.Item name="imapHost" label="IMAP 主机" rules={[{ required: true }]}>
          <Input placeholder="imap.example.com" disabled={!isCustom && !!emailType} />
        </Form.Item>

        <Form.Item name="imapPort" label="IMAP 端口" rules={[{ required: true }]}>
          <Input type="number" placeholder="993" disabled={!isCustom && !!emailType} />
        </Form.Item>

        <Form.Item name="smtpHost" label="SMTP 主机" rules={[{ required: true }]}>
          <Input placeholder="smtp.example.com" disabled={!isCustom && !!emailType} />
        </Form.Item>

        <Form.Item name="smtpPort" label="SMTP 端口" rules={[{ required: true }]}>
          <Input type="number" placeholder="465" disabled={!isCustom && !!emailType} />
        </Form.Item>

        <Form.Item name="account" label="账号" rules={[{ required: true, message: '请输入邮箱账号' }]}>
          <Input placeholder="user@example.com" />
        </Form.Item>

        <Form.Item name="authCode" label="授权码" rules={[{ required: true, message: '请输入授权码' }]}>
          <Input.Password placeholder="邮箱授权码（非登录密码）" />
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
