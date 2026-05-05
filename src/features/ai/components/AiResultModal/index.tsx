import { useMemo } from 'react'
import { Modal, Tabs, Button, message, Tooltip } from 'antd'
import { CopyOutlined, GlobalOutlined, TranslationOutlined } from '@ant-design/icons'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface AiResultModalProps {
  visible: boolean
  originalContent: string
  chineseContent: string
  onUse: (content: string) => void
  onClose: () => void
}

function ReadOnlyEditor({ content }: { content: string }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: false,
  })

  if (!editor) return null

  return (
    <div className="rounded-lg overflow-hidden border border-solid border-gray-200">
      <div className="p-4 max-h-80 overflow-auto bg-gray-50">
        <EditorContent editor={editor} className="tiptap-readonly-editor" />
      </div>
    </div>
  )
}

function ChineseReadOnlyEditor({ content }: { content: string }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: false,
  })

  if (!editor) return null

  return (
    <div className="rounded-lg overflow-hidden border border-amber-200">
      <div className="p-4 max-h-80 overflow-auto bg-amber-50">
        <EditorContent editor={editor} className="tiptap-readonly-editor" />
      </div>
    </div>
  )
}

export default function AiResultModal({
  visible,
  originalContent,
  chineseContent,
  onUse,
  onClose,
}: AiResultModalProps) {
  // 从 AI 返回的内容中分离原始语言和中文翻译
  const { originalPart, chinesePart } = useMemo(() => {
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

    return {
      originalPart: originalContent,
      chinesePart: chineseContent || originalContent,
    }
  }, [originalContent, chineseContent])

  const handleCopyOriginal = async () => {
    try {
      await navigator.clipboard.writeText(originalPart)
      message.success('已复制原文回复')
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
          <div className="absolute top-2 right-2 z-10">
            <Tooltip title="复制原文">
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopyOriginal}
              />
            </Tooltip>
          </div>
          <ReadOnlyEditor content={originalPart} />
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
          <div className="absolute top-2 right-2 z-10">
            <Tooltip title="复制中文">
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopyChinese}
              />
            </Tooltip>
          </div>
          <ChineseReadOnlyEditor content={chinesePart} />
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
