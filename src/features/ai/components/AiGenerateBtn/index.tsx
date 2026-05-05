import { Button, message } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import { useAiGenerate } from '../../hooks/useAiGenerate'
import { useAiConfig } from '@/features/config/hooks/useAiConfig'
import type { AiGenerateRequest } from '@/types/mail'

interface AiGenerateBtnProps {
  mailSubject: string
  mailFrom: string
  mailBody: string
  onGenerated: (content: string) => void
}

export default function AiGenerateBtn({
  mailSubject,
  mailFrom,
  mailBody,
  onGenerated,
}: AiGenerateBtnProps) {
  const generateMutation = useAiGenerate()
  const { data: aiConfigs } = useAiConfig()

  const handleGenerate = async () => {
    if (!aiConfigs || aiConfigs.length === 0) {
      message.warning('请先在设置页面配置 AI 服务')
      return
    }

    const aiConfig = aiConfigs[0]!
    const data: AiGenerateRequest = {
      subject: mailSubject,
      from: mailFrom,
      body: mailBody,
      prompt: aiConfig.systemPrompt || '',
    }

    try {
      const result = await generateMutation.mutateAsync(data)
      onGenerated(result.data.content)
      message.success('AI 回复生成成功')
    } catch {
      // 错误已在拦截器中处理
    }
  }

  return (
    <Button
      icon={<RobotOutlined />}
      onClick={handleGenerate}
      loading={generateMutation.isPending}
    >
      AI 生成
    </Button>
  )
}
