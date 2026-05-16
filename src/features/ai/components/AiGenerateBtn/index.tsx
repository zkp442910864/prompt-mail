import { useState } from 'react'
import { Button, message, Input, Popover } from 'antd'
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
  const [extraPrompt, setExtraPrompt] = useState('')
  const [popoverOpen, setPopoverOpen] = useState(false)
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
      extraPrompt: extraPrompt.trim() || undefined,
    }

    setPopoverOpen(false)

    try {
      const result = await generateMutation.mutateAsync(data)
      onGenerated(result.data.content)
    } catch {
      // 错误已在拦截器中处理
    }
  }

  const popoverContent = (
    <div style={{ width: 280 }}>
      <div className="text-xs text-gray-500 mb-2">
        输入额外提示词，指导 AI 生成更符合需求的回复
      </div>
      <Input.TextArea
        value={extraPrompt}
        onChange={(e) => setExtraPrompt(e.target.value)}
        placeholder="例如：语气要礼貌、强调退款政策、用日语回复..."
        autoSize={{ minRows: 2, maxRows: 4 }}
        className="text-xs"
        onPressEnter={(e) => {
          if (!e.shiftKey) {
            e.preventDefault()
            handleGenerate()
          }
        }}
      />
      <div className="flex justify-end mt-2">
        <Button
          type="primary"
          size="small"
          icon={<RobotOutlined />}
          onClick={handleGenerate}
          loading={generateMutation.isPending}
        >
          生成回复
        </Button>
      </div>
    </div>
  )

  return (
    <Popover
      content={popoverContent}
      title="AI 生成回复"
      trigger="click"
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
      placement="topLeft"
    >
      <Button
        icon={<RobotOutlined />}
        onClick={() => setPopoverOpen(true)}
        loading={generateMutation.isPending}
        size="small"
      >
        AI 生成
      </Button>
    </Popover>
  )
}
