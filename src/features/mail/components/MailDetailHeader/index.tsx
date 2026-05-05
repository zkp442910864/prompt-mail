import dayjs from 'dayjs'
import type { MailDetail } from '@/types/mail'

interface MailDetailHeaderProps {
  detail: MailDetail
}

export default function MailDetailHeader({ detail }: MailDetailHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-bold text-gray-800 mb-2">{detail.subject}</h2>
      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
        <span>发件人: {detail.from.name || detail.from.address}</span>
        <span>日期: {dayjs(detail.date).format('YYYY-MM-DD HH:mm')}</span>
        {detail.to.length > 0 && (
          <span>收件人: {detail.to.map((t) => t.address).join(', ')}</span>
        )}
      </div>
    </div>
  )
}
