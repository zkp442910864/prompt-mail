import { useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MailListPanel from '@/features/mail/components/MailListPanel'
import MailDetailPanel from '@/features/mail/components/MailDetailPanel'
import { useMailContext } from '@/features/mail/context/MailContext'

export default function InboxPage() {
  const { mailId } = useParams<{ mailId?: string }>()
  const navigate = useNavigate()
  const { state, dispatch } = useMailContext()

  // URL → Context：URL 参数变化时同步到 MailContext
  useEffect(() => {
    const targetId = mailId || null
    if (targetId !== state.selectedMailId) {
      dispatch({ type: 'SET_SELECTED_MAIL', payload: targetId })
    }
  }, [mailId])

  // Context → URL：列表点击 / 清空选中时同步到 URL
  const handleSelectMail = useCallback((id: string | null) => {
    if (id) {
      navigate(`/inbox/${id}`, { replace: true })
    } else {
      navigate('/inbox', { replace: true })
    }
  }, [navigate])

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-380px flex-shrink-0">
        <MailListPanel onSelectMail={handleSelectMail} />
      </div>
      <div className="flex-1 min-w-0">
        <MailDetailPanel />
      </div>
    </div>
  )
}
