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
    limit: 50,
  })
  const markReadMutation = useMarkRead(state.currentEmailConfigId)

  const handleSelectMail = (id: string) => {
    dispatch({ type: 'SET_SELECTED_MAIL', payload: id })
    // 标记已读
    const mail = mails?.find((m) => m.id === id)
    if (mail && !mail.isRead) {
      markReadMutation.mutate({ uid: id })
    }
  }

  return (
    <div className="flex flex-col h-full border-r border-gray-200">
      <MailFilterBar onRefresh={() => refetch()} loading={isLoading} />
      {isLoading ? (
        <Loading />
      ) : (
        <div className="flex-1 min-h-0">
          <MailList
            mails={mails || []}
            selectedMailId={state.selectedMailId}
            onSelectMail={handleSelectMail}
          />
        </div>
      )}
    </div>
  )
}
