import { useState } from 'react'
import { Empty, Button, Tooltip, Spin } from 'antd'
import { MailOutlined, TranslationOutlined } from '@ant-design/icons'
import MailDetailHeader from '../MailDetailHeader'
import MailDetailBody from '../MailDetailBody'
import MailAttachments from '../MailAttachments'
import MailReplyEditor from '../MailReplyEditor'
import { useMailContext } from '../../context/MailContext'
import { useMailDetail } from '../../hooks/useMailDetail'
import { useAiTranslate } from '@/features/ai/hooks/useAiTranslate'
import { useAiConfig } from '@/features/config/hooks/useAiConfig'
import { marked } from 'marked'
import { sanitizeHtml } from '@/utils/sanitizer'
import Loading from '@/components/Loading'

export default function MailDetailPanel() {
  const { state } = useMailContext()
  const { data: detail, isLoading } = useMailDetail(
    state.selectedMailId,
    state.currentEmailConfigId,
  )
  const [replyVisible, setReplyVisible] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [translatedContent, setTranslatedContent] = useState<string>('')

  const translateMutation = useAiTranslate()
  const { data: aiConfigs } = useAiConfig()

  const handleTranslate = async () => {
    if (!detail) return

    if (!aiConfigs || aiConfigs.length === 0) {
      return // 按钮已 disabled
    }

    // 如果已有翻译结果，切换显示
    if (translatedContent) {
      setShowTranslation((prev) => !prev)
      return
    }

    // 调用 AI 翻译
    try {
      const body = detail.html || detail.text || ''
      const result = await translateMutation.mutateAsync({
        subject: detail.subject,
        body,
      })
      setTranslatedContent(result.data.content)
      setShowTranslation(true)
    } catch {
      // 错误已在 hook 中处理
    }
  }

  if (!state.currentEmailConfigId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description="请先选择邮箱" />
      </div>
    )
  }

  if (!state.selectedMailId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description="请选择一封邮件查看" />
      </div>
    )
  }

  if (isLoading) {
    return <Loading />
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description="邮件详情加载失败" />
      </div>
    )
  }

  const hasAiConfig = aiConfigs && aiConfigs.length > 0

  return (
    <div className="flex flex-col h-full relative">
      <MailDetailHeader detail={detail} />

      {/* 翻译内容展示 */}
      {showTranslation && translatedContent ? (
        <div className="flex-1 min-h-0 overflow-auto pb-16">
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <span className="text-sm text-blue-600 font-medium">📝 AI 中文翻译</span>
            <Button
              size="small"
              type="link"
              onClick={() => setShowTranslation(false)}
            >
              查看原文
            </Button>
          </div>
          <div
            className="px-6 py-4 mail-body"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked.parse(translatedContent, { async: false }) as string) }}
          />
          <MailAttachments
            attachments={detail.attachments}
            emailConfigId={state.currentEmailConfigId!}
            uid={detail.id}
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto pb-16">
          <MailDetailBody html={detail.html} text={detail.text} />
          <MailAttachments
            attachments={detail.attachments}
            emailConfigId={state.currentEmailConfigId!}
            uid={detail.id}
          />
        </div>
      )}

      {/* 底部悬浮按钮组 */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Tooltip title={hasAiConfig ? (showTranslation ? '查看原文' : '翻译中文') : '请先配置 AI 服务'} placement="left">
          <Button
            type="default"
            shape="circle"
            size="large"
            icon={translateMutation.isPending ? <Spin size="small" /> : <TranslationOutlined />}
            onClick={handleTranslate}
            disabled={!hasAiConfig || translateMutation.isPending}
            className="shadow-lg !w-12 !h-12"
            style={{ fontSize: 18, borderColor: '#1677ff', color: '#1677ff' }}
          />
        </Tooltip>
        <Tooltip title="回复邮件" placement="left">
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<MailOutlined />}
            onClick={() => setReplyVisible(true)}
            className="shadow-lg !w-12 !h-12"
            style={{ fontSize: 18 }}
          />
        </Tooltip>
      </div>

      {/* 悬浮回复小窗 */}
      <MailReplyEditor
        detail={detail}
        emailConfigId={state.currentEmailConfigId!}
        visible={replyVisible}
        onClose={() => setReplyVisible(false)}
      />
    </div>
  )
}
