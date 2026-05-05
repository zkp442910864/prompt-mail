import { useState, useMemo } from 'react'
import { Modal, Tabs, Button, message } from 'antd'
import { CopyOutlined, CheckOutlined, GlobalOutlined, TranslationOutlined } from '@ant-design/icons'

interface AiResultModalProps {
  visible: boolean
  originalContent: string
  chineseContent: string
  onUse: (content: string) => void
  onClose: () => void
}

export default function AiResultModal({
  visible,
  originalContent,
  chineseContent,
  onUse,
  onClose,
}: AiResultModalProps) {
  const [copiedOriginal, setCopiedOriginal] = useState(false)

  // 从 AI 返回的内容中分离原始语言和中文翻译
  // AI 通常会返回两部分：原文回复 + 中文翻译
  const { originalPart, chinesePart } = useMemo(() => {
    // 尝试从内容中提取中文翻译部分
    // 常见格式：--- 或 【中文翻译】等分隔符
    const separators = [
      /\n---+\s*\n/,
      /\n【中文翻译】\n/,
      /\n\[中文翻译\]\n/,
      /\n中文翻译[：:]\n/,
      /\nChinese Translation[：:]\n/i,
    ]

    for (const sep of separators) {
      const match = originalContent.split(sep)
      if (match.length >= 2) {
        return {
          originalPart: match[0]!.trim(),
          chinesePart: match.slice(1).join('\n').trim(),
        }
      }
    }

    // 如果没有分隔符，原文=AI原始回复，中文=同一份内容（用户可手动调整）
    return {
      originalPart: originalContent,
      chinesePart: chineseContent,
    }
  }, [originalContent, chineseContent])

  const handleCopyOriginal = async () => {
    try {
      await navigator.clipboard.writeText(originalPart)
      setCopiedOriginal(true)
      message.success('已复制原文回复')
      setTimeout(() => setCopiedOriginal(false), 2000)
    } catch {
      message.error('复制失败')
    }
  }

  const handleCopyChinese = async () => {
    try {
      await navigator.clipboard.writeText(chinesePart)
      message.success('已复制中文翻译')
    } catch {
      message.error('复制失败')
    }
  }

  const tabItems = [
    {
      key: 'original',
      label: (
        <span className="flex items-center gap-1.5">
          <GlobalOutlined />
          邮件语言
        </span>
      ),
      children: (
        <div className="relative">
          <div className="absolute top-0 right-0 z-10">
            <Button
              size="small"
              type={copiedOriginal ? 'primary' : 'default'}
              icon={copiedOriginal ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopyOriginal}
            >
              {copiedOriginal ? '已复制' : '复制'}
            </Button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 pr-24 whitespace-pre-wrap text-sm text-gray-800 max-h-80 overflow-auto border border-solid border-gray-200">
            {originalPart}
          </div>
        </div>
      ),
    },
    {
      key: 'chinese',
      label: (
        <span className="flex items-center gap-1.5">
          <TranslationOutlined />
          中文对照
        </span>
      ),
      children: (
        <div className="relative">
          <div className="absolute top-0 right-0 z-10">
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopyChinese}
            >
              复制
            </Button>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 pr-24 whitespace-pre-wrap text-sm text-gray-800 max-h-80 overflow-auto border border-amber-200">
            {chinesePart}
          </div>
        </div>
      ),
    },
  ]

  return (
    <Modal
      title="🤖 AI 生成回复"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="use-original"
          onClick={() => onUse(originalPart)}
        >
          使用原文回复
        </Button>,
        <Button
          key="use-chinese"
          type="primary"
          onClick={() => onUse(chinesePart)}
        >
          使用中文回复
        </Button>,
      ]}
    >
      <div className="mb-3">
        <Tabs items={tabItems} defaultActiveKey="original" />
      </div>
    </Modal>
  )
}
