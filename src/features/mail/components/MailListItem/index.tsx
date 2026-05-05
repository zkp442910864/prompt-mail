import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { PaperClipOutlined, MailOutlined } from '@ant-design/icons'
import type { MailSummary } from '@/types/mail'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

interface MailListItemProps {
  mail: MailSummary
  selected?: boolean
  onClick?: () => void
}

export default function MailListItem({ mail, selected, onClick }: MailListItemProps) {
  const isUnread = !mail.isRead

  return (
    <div
      className={`
        relative px-4 py-3 cursor-pointer transition-all duration-200 border-b border-gray-100
        ${selected
          ? 'bg-blue-50 border-l-3 border-l-blue-500'
          : isUnread
            ? 'bg-white border-l-3 border-l-blue-400 hover:bg-gray-50'
            : 'bg-white border-l-3 border-l-transparent hover:bg-gray-50'
        }
      `}
      onClick={onClick}
    >
      {/* 第一行：发件人 + 时间 */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* 未读圆点指示器 */}
          {isUnread && (
            <span className="shrink-0 w-2 h-2 rounded-full bg-blue-500" />
          )}
          <span className={`
            text-sm truncate
            ${isUnread ? 'text-gray-900 font-bold' : 'text-gray-600 font-normal'}
          `}>
            {mail.from.name || mail.from.address}
          </span>
        </div>
        <span className={`text-xs shrink-0 ml-2 ${isUnread ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
          {dayjs(mail.date).isToday() ? dayjs(mail.date).format('HH:mm') : dayjs(mail.date).format('MM/DD')}
        </span>
      </div>

      {/* 第二行：主题 */}
      <div className={`
        text-sm truncate mb-0.5
        ${isUnread ? 'text-gray-900 font-semibold' : 'text-gray-500 font-normal'}
      `}>
        {mail.subject}
      </div>

      {/* 第三行：摘要 + 附件图标 */}
      <div className="flex items-center gap-1.5">
        {mail.hasAttachments && (
          <PaperClipOutlined className="text-xs text-gray-400 shrink-0" />
        )}
        <span className="text-xs text-gray-400 truncate">
          {mail.snippet}
        </span>
      </div>
    </div>
  )
}
