import { Empty } from 'antd'
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
    <div className="flex flex-col h-full">
      <MailDetailHeader detail={detail} />
      <div className="flex-1 min-h-0 overflow-auto">
        <MailDetailBody html={detail.html} text={detail.text} />
        <MailAttachments
          attachments={detail.attachments}
          emailConfigId={state.currentEmailConfigId!}
          uid={detail.id}
        />
      </div>
      <MailReplyEditor detail={detail} emailConfigId={state.currentEmailConfigId!} />
    </div>
  )
}
