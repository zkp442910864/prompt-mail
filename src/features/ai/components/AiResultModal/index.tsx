import { useMemo } from 'react'
import { Modal, Tabs, Button, message, Tooltip } from 'antd'
import { CopyOutlined, GlobalOutlined, TranslationOutlined } from '@ant-design/icons'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { marked } from 'marked'

interface AiResultModalProps {
  visible: boolean
  originalContent: string
  chineseContent: string
  onUse: (content: string) => void
  onClose: () => void
}

/** 将 Markdown 文本转为 HTML */
function markdownToHtml(md: string): string {
  try {
    return marked.parse(md, { async: false }) as string
  } catch {
    // 如果解析失败，包裹在 <pre> 中保留原文
    return `<pre style="white-space:pre-wrap">${md}</pre>`
  }
}

/** 只读富文本编辑器 */
function ReadOnlyEditor({ content, bgClass }: { content: string; bgClass: string }) {
  // 将 Markdown 内容转为 HTML 供 TipTap 渲染
  const htmlContent = useMemo(() => markdownToHtml(content), [content])

  const editor = useEditor({
    extensions: [StarterKit],
    content: htmlContent,
    editable: false,
  })

  if (!editor) return null

  return (
    <div className={`rounded-lg p-4 max-h-80 overflow-auto ${bgClass}`}>
      <EditorContent editor={editor} className="tiptap-readonly-editor" />
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
          <ReadOnlyEditor content={originalPart} bgClass="bg-gray-50 border border-solid border-gray-200 rounded-lg" />
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
          <ReadOnlyEditor content={chinesePart} bgClass="bg-amber-50 border border-amber-200 rounded-lg" />
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
