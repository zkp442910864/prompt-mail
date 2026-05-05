import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { Empty } from 'antd'
import MailListItem from '../MailListItem'
import type { MailSummary } from '@/types/mail'

interface MailListProps {
  mails: MailSummary[]
  selectedMailId: string | null
  checkedIds: Set<string>
  onSelectMail: (id: string) => void
  onCheck: (id: string, checked: boolean) => void
}

export default function MailList({ mails, selectedMailId, checkedIds, onSelectMail, onCheck }: MailListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: mails.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 5,
  })

  if (mails.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty description="暂无邮件" />
      </div>
    )
  }

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const mail = mails[virtualItem.index]!
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MailListItem
                mail={mail}
                selected={mail.id === selectedMailId}
                checked={checkedIds.has(mail.id)}
                onCheck={(checked) => onCheck(mail.id, checked)}
                onClick={() => onSelectMail(mail.id)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
