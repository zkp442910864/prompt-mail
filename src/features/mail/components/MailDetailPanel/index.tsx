import { useState } from 'react'
import { Empty, Button } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import MailDetailHeader from '../MailDetailHeader'
import MailDetailBody from '../MailDetailBody'
import MailAttachments from '../MailAttachments'
import MailReplyEditor from '../MailReplyEditor'
import { useMailContext } from '../../context/MailContext'
import { useMailDetail } from '../../hooks/useMailDetail'
import Loading from '@/components/Loading'

export default function MailDetailPanel() {
  const { state } = useMailContext()
  const { data: detail, isLoading } = useMailDetail(
    state.selectedMailId,
    state.currentEmailConfigId,
  )
  const [replyVisible, setReplyVisible] = useState(false)

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

  return (
    <div className="flex flex-col h-full relative">
      <MailDetailHeader detail={detail} />
      <div className="flex-1 min-h-0 overflow-auto pb-16">
        <MailDetailBody html={detail.html} text={detail.text} />
        <MailAttachments
          attachments={detail.attachments}
          emailConfigId={state.currentEmailConfigId!}
          uid={detail.id}
        />
      </div>

      {/* 底部悬浮回复按钮 */}
      <div className="absolute bottom-4 right-4">
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<MailOutlined />}
          onClick={() => setReplyVisible(true)}
          className="shadow-lg !w-12 !h-12"
          style={{ fontSize: 18 }}
        />
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
