import MailListPanel from '@/features/mail/components/MailListPanel'
import MailDetailPanel from '@/features/mail/components/MailDetailPanel'

export default function InboxPage() {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-380px flex-shrink-0">
        <MailListPanel />
      </div>
      <div className="flex-1 min-w-0">
        <MailDetailPanel />
      </div>
    </div>
  )
}
