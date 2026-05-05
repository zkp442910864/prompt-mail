import { useState, useCallback, useRef, useEffect } from 'react'
import { Button, message, Tooltip } from 'antd'
import {
  SendOutlined,
  MinusOutlined,
  ExpandOutlined,
  CompressOutlined,
  CloseOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import AiGenerateBtn from '@/features/ai/components/AiGenerateBtn'
import AiResultModal from '@/features/ai/components/AiResultModal'
import { useMailReply } from '../../hooks/useMailReply'
import type { MailDetail } from '@/types/mail'

interface MailReplyEditorProps {
  detail: MailDetail
  emailConfigId: string
  visible: boolean
  onClose: () => void
}

type WindowState = 'normal' | 'minimized' | 'maximized'

export default function MailReplyEditor({ detail, emailConfigId, visible, onClose }: MailReplyEditorProps) {
  const [windowState, setWindowState] = useState<WindowState>('normal')
  const [aiResultVisible, setAiResultVisible] = useState(false)
  const [aiOriginalContent, setAiOriginalContent] = useState('')
  const [aiChineseContent, setAiChineseContent] = useState('')
  const replyMutation = useMailReply()
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [initialized, setInitialized] = useState(false)

  // 初始位置：右下角
  useEffect(() => {
    if (visible && !initialized) {
      setPosition({
        x: window.innerWidth - 460,
        y: window.innerHeight - 420,
      })
      setInitialized(true)
    }
  }, [visible, initialized])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '输入回复内容...',
      }),
    ],
    content: '',
  })

  // 拖拽逻辑
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (windowState === 'maximized') return
    e.preventDefault()
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: position.x,
      origY: position.y,
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setPosition({
        x: dragRef.current.origX + dx,
        y: Math.max(0, dragRef.current.origY + dy),
      })
    }

    const handleMouseUp = () => {
      dragRef.current = null
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [position, windowState])

  const handleAiGenerated = useCallback((content: string) => {
    // 将 AI 生成内容展示在弹窗中
    setAiOriginalContent(content)
    // 生成中文翻译版本（提取纯文本作为中文对照提示）
    setAiChineseContent(content)
    setAiResultVisible(true)
  }, [])

  const handleUseContent = useCallback((content: string) => {
    editor?.commands.setContent(content)
    setAiResultVisible(false)
    message.success('已填入回复内容')
  }, [editor])

  const handleSend = async () => {
    const html = editor?.getHTML() || ''
    if (!html || html === '<p></p>') {
      message.warning('请输入回复内容')
      return
    }

    replyMutation.mutate({
      emailConfigId,
      to: [detail.from.address],
      subject: detail.subject.startsWith('Re: ') ? detail.subject : `Re: ${detail.subject}`,
      body: html,
      inReplyTo: detail.messageId,
    })

    editor?.commands.setContent('')
  }

  if (!visible) return null

  // 最小化状态：只显示一个小条
  if (windowState === 'minimized') {
    return (
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
        style={{ left: position.x, top: position.y, width: 280 }}
      >
        <div
          className="flex items-center justify-between px-3 py-2 bg-blue-500 text-white cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <EditOutlined />
            <span className="text-sm font-medium truncate">
              回复: {(detail.subject || '').slice(0, 20)}...
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip title="展开">
              <Button
                type="text"
                size="small"
                icon={<ExpandOutlined />}
                className="!text-white hover:!bg-blue-600"
                onClick={() => setWindowState('normal')}
              />
            </Tooltip>
          </div>
        </div>
      </div>
    )
  }

  const isMaximized = windowState === 'maximized'
  const width = isMaximized ? '100%' : '440px'
  const height = isMaximized ? '100%' : '400px'
  const panelStyle: React.CSSProperties = isMaximized
    ? { position: 'fixed', inset: 0, zIndex: 50 }
    : { position: 'fixed', left: position.x, top: position.y, width, height, zIndex: 50 }

  return (
    <>
      <div
        ref={panelRef}
        className="bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        style={panelStyle}
      >
        {/* 标题栏 - 可拖动 */}
        <div
          className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <span className="text-sm font-medium truncate">
            ✉️ 回复: {detail.subject}
          </span>
          <div className="flex items-center gap-0.5">
            <Tooltip title="最小化">
              <Button
                type="text"
                size="small"
                icon={<MinusOutlined />}
                className="!text-white hover:!bg-blue-700"
                onClick={() => setWindowState('minimized')}
              />
            </Tooltip>
            <Tooltip title={isMaximized ? '还原' : '最大化'}>
              <Button
                type="text"
                size="small"
                icon={isMaximized ? <CompressOutlined /> : <ExpandOutlined />}
                className="!text-white hover:!bg-blue-700"
                onClick={() => setWindowState(isMaximized ? 'normal' : 'maximized')}
              />
            </Tooltip>
            <Tooltip title="关闭">
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                className="!text-white hover:!bg-red-500"
                onClick={onClose}
              />
            </Tooltip>
          </div>
        </div>

        {/* 回复对象 */}
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-500">
            回复给 <span className="text-gray-700 font-medium">{detail.from.name || detail.from.address}</span>
          </span>
        </div>

        {/* 编辑器区域 */}
        <div className="flex-1 min-h-0 overflow-auto border-b border-gray-100">
          <div className="p-3">
            <EditorContent editor={editor} className="tiptap-reply-editor" />
          </div>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
          <AiGenerateBtn
            mailSubject={detail.subject}
            mailFrom={detail.from.address}
            mailBody={detail.html || detail.text}
            onGenerated={handleAiGenerated}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={replyMutation.isPending}
            size="small"
          >
            发送回复
          </Button>
        </div>
      </div>

      {/* AI 生成结果弹窗 */}
      <AiResultModal
        visible={aiResultVisible}
        originalContent={aiOriginalContent}
        chineseContent={aiChineseContent}
        onUse={handleUseContent}
        onClose={() => setAiResultVisible(false)}
      />
    </>
  )
}
