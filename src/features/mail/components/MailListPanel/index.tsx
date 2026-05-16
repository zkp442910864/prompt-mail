import { useState, useCallback } from 'react'
import MailFilterBar from '../MailFilterBar'
import MailList from '../MailList'
import { useMailContext } from '../../context/MailContext'
import { useMailList } from '../../hooks/useMailList'
import { useMarkRead } from '../../hooks/useMarkRead'
import Loading from '@/components/Loading'

export default function MailListPanel() {
  const { state, dispatch } = useMailContext()
  const { data: mails, isLoading, refetch } = useMailList({
    emailConfigId: state.currentEmailConfigId || '',
    filter: state.filter,
    limit: 100,
  })
  const markReadMutation = useMarkRead(state.currentEmailConfigId)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  const unreadCount = mails?.filter((m) => !m.isRead).length || 0

  const handleSelectMail = (id: string) => {
    dispatch({ type: 'SET_SELECTED_MAIL', payload: id })
    // 标记已读
    const mail = mails?.find((m) => m.id === id)
    if (mail && !mail.isRead) {
      markReadMutation.mutate({ uid: id })
    }
  }

  const handleCheck = useCallback((id: string, checked: boolean) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  return (
    <div className="flex flex-col h-full border-r border-gray-200">
      <MailFilterBar onRefresh={() => refetch()} loading={isLoading} unreadCount={unreadCount} />
      {isLoading ? (
        <Loading />
      ) : (
        <div className="flex-1 min-h-0">
          <MailList
            mails={mails || []}
            selectedMailId={state.selectedMailId}
            checkedIds={checkedIds}
            onSelectMail={handleSelectMail}
            onCheck={handleCheck}
          />
        </div>
      )}
    </div>
  )
}
