import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Button, message, Tooltip, Upload, Input, Tag } from 'antd'
import type { UploadFile } from 'antd'
import {
  SendOutlined,
  MinusOutlined,
  ExpandOutlined,
  CompressOutlined,
  CloseOutlined,
  EditOutlined,
  InboxOutlined,
  PaperClipOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { marked } from 'marked'
import Placeholder from '@tiptap/extension-placeholder'
import dayjs from 'dayjs'
import AiGenerateBtn from '@/features/ai/components/AiGenerateBtn'
import AiResultModal from '@/features/ai/components/AiResultModal'
import { useMailReply } from '../../hooks/useMailReply'
import { extractReplyToEmail, isFromSystemEmail, extractEmailsFromText, isSystemEmail } from '@/utils/emailExtractor'
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
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [showDropZone, setShowDropZone] = useState(false)
  const replyMutation = useMailReply()
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [initialized, setInitialized] = useState(false)

  // 从邮件正文中提取客户邮箱，作为回复目标
  const replyToEmail = useMemo(() => {
    return extractReplyToEmail(
      detail.from.address,
      detail.text || '',
      detail.html,
    )
  }, [detail.from.address, detail.text, detail.html])

  // 是否为系统/通知邮件（发件人不是客户）
  const isSystemMail = useMemo(() => isFromSystemEmail(detail.from.address), [detail.from.address])

  // 正文中提取到的所有客户邮箱（供用户选择）
  const bodyEmails = useMemo(() => {
    const content = detail.html || detail.text || ''
    return extractEmailsFromText(content).filter(
      (email) => !isSystemEmail(email) && email !== detail.from.address.toLowerCase(),
    )
  }, [detail.html, detail.text, detail.from.address])

  // 可编辑的收件人
  const [recipientEmail, setRecipientEmail] = useState('')

  // 初始化收件人
  useEffect(() => {
    if (visible) {
      setRecipientEmail(replyToEmail)
    }
  }, [visible, replyToEmail])

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
    setAiOriginalContent(content)
    setAiChineseContent('')
    setAiResultVisible(true)
  }, [])

  const handleUseContent = useCallback((content: string) => {
    const html = marked.parse(content, { async: false }) as string
    editor?.commands.setContent(html)
    setAiResultVisible(false)
    message.success('已填入回复内容')
  }, [editor])

  /** 构建原始邮件引用 HTML（Gmail 风格引用块） */
  const buildQuoteHtml = useCallback((detail: MailDetail): string => {
    const sender = detail.from.name
      ? `${detail.from.name} <${detail.from.address}>`
      : detail.from.address
    const date = dayjs(detail.date).format('YYYY年M月D日 HH:mm')
    const subject = detail.subject

    // 引用头：On ... wrote:
    const quoteHeader = `<p style="margin:0;padding:0;">在 ${date}，${sender} 写道：</p>`

    // 引用正文：优先用 HTML，回退到纯文本
    let quotedBody: string
    if (detail.html) {
      quotedBody = detail.html
    } else if (detail.text) {
      // 纯文本转 HTML：换行→<br>，保留空格
      quotedBody = detail.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
    } else {
      quotedBody = '<p>(邮件正文为空)</p>'
    }

    // 包裹在 blockquote 中（左侧蓝色边框 + 缩进，标准邮件引用样式）
    return `
      ${quoteHeader}
      <blockquote style="margin:4px 0 0 0;padding:4px 12px;border-left:3px solid #ccc;color:#555;">
        ${quotedBody}
      </blockquote>
    `.trim()
  }, [])

  const handleSend = async () => {
    const html = editor?.getHTML() || ''
    if (!html || html === '<p></p>') {
      message.warning('请输入回复内容')
      return
    }

    const toEmail = recipientEmail.trim()
    if (!toEmail) {
      message.warning('请输入收件人邮箱')
      return
    }

    // 拼接：回复内容 + 原文引用
    const quoteHtml = buildQuoteHtml(detail)
    const fullBody = `${html}<br><br>${quoteHtml}`

    replyMutation.mutate({
      emailConfigId,
      to: [toEmail],
      subject: detail.subject.startsWith('Re: ') ? detail.subject : `Re: ${detail.subject}`,
      body: fullBody,
      inReplyTo: detail.messageId,
    })

    editor?.commands.setContent('')
  }

  if (!visible) return null

  // 最小化状态
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

        {/* 收件人区域 */}
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 mb-1.5">
            <UserOutlined className="text-gray-400 text-xs" />
            <span className="text-xs text-gray-500 shrink-0">收件人:</span>
            {isSystemMail && (
              <Tag color="orange" className="text-[10px] leading-tight px-1 py-0">
                系统邮件
              </Tag>
            )}
          </div>
          <Input
            size="small"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="输入收件人邮箱"
            className="text-xs"
          />
          {isSystemMail && bodyEmails.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              <span className="text-[10px] text-gray-400 shrink-0">正文中检测到:</span>
              {bodyEmails.map((email) => (
                <Tag
                  key={email}
                  color={recipientEmail === email ? 'blue' : 'default'}
                  className="text-[10px] cursor-pointer px-1 py-0"
                  onClick={() => setRecipientEmail(email)}
                >
                  {email}
                </Tag>
              ))}
            </div>
          )}
          {isSystemMail && (
            <div className="text-[10px] text-amber-500 mt-1">
              ⚠️ 发件人 {detail.from.address} 为系统邮箱，已自动从正文提取客户邮箱
            </div>
          )}
        </div>

        {/* 编辑器区域 */}
        <div className="flex-1 min-h-0 overflow-auto border-b border-gray-100">
          <div className="p-3">
            <EditorContent editor={editor} className="tiptap-reply-editor" />
          </div>
        </div>

        {/* 附件区域 */}
        {fileList.length > 0 && (
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <PaperClipOutlined />
              <span>附件 ({fileList.length})</span>
            </div>
            <Upload
              fileList={fileList}
              onRemove={(file) => {
                const index = fileList.indexOf(file)
                const newFileList = fileList.slice()
                newFileList.splice(index, 1)
                setFileList(newFileList)
              }}
              beforeUpload={() => false}
              showUploadList
            />
          </div>
        )}

        {/* 拖拽上传区域 */}
        {showDropZone && (
          <div className="px-3 py-2 border-b border-gray-100">
            <Upload.Dragger
              multiple
              showUploadList={false}
              beforeUpload={() => false}
              onChange={({ fileList: newFileList }) => {
                setFileList((prev) => [...prev, ...newFileList])
                setShowDropZone(false)
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text text-xs">点击或拖拽文件到此处上传附件</p>
            </Upload.Dragger>
          </div>
        )}

        {/* 工具栏 */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
          <div className="flex items-center gap-2">
            <AiGenerateBtn
              mailSubject={detail.subject}
              mailFrom={detail.from.address}
              mailBody={detail.html || detail.text}
              onGenerated={handleAiGenerated}
            />
            <Tooltip title="添加附件">
              <Button
                size="small"
                icon={<PaperClipOutlined />}
                onClick={() => setShowDropZone((prev) => !prev)}
              />
            </Tooltip>
          </div>
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
