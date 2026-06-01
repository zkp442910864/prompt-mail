import { useState, useCallback, useEffect, useRef } from 'react'
import MailFilterBar from '../MailFilterBar'
import MailList from '../MailList'
import { useMailContext } from '../../context/MailContext'
import { useMailList } from '../../hooks/useMailList'
import { useMarkRead } from '../../hooks/useMarkRead'
import Loading from '@/components/Loading'

interface MailListPanelProps {
  onSelectMail?: (id: string | null) => void
}

export default function MailListPanel({ onSelectMail }: MailListPanelProps) {
  const { state } = useMailContext()
  const [keyword, setKeyword] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [debouncedKeyword, setDebouncedKeyword] = useState('')

  // 防抖 300ms，避免每次按键都触发 IMAP 搜索
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedKeyword(keyword)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [keyword])

  const { data: mails, isLoading, refetch } = useMailList({
    emailConfigId: state.currentEmailConfigId || '',
    filter: state.filter,
    limit: 100,
    keyword: debouncedKeyword || undefined,
  })
  const markReadMutation = useMarkRead(state.currentEmailConfigId)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  const unreadCount = mails?.filter((m) => !m.isRead).length || 0

  const handleSelectMail = (id: string) => {
    // 通知父组件更新 URL
    onSelectMail?.(id)
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
      <MailFilterBar
        onRefresh={() => refetch()}
        loading={isLoading}
        unreadCount={unreadCount}
        keyword={keyword}
        onKeywordChange={setKeyword}
      />
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
