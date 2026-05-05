import { useCallback, useState } from 'react'
import dayjs from 'dayjs'
import {
  StarOutlined,
  StarFilled,
  PaperClipOutlined,
} from '@ant-design/icons'
import { Checkbox } from 'antd'
import type { MailSummary } from '@/types/mail'

interface MailListItemProps {
  mail: MailSummary
  selected?: boolean
  checked?: boolean
  onCheck?: (checked: boolean) => void
  onClick?: () => void
}

export default function MailListItem({ mail, selected, checked, onCheck, onClick }: MailListItemProps) {
  const isUnread = !mail.isRead
  const [starred, setStarred] = useState(false)

  const handleStarClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setStarred((prev) => !prev)
  }, [])

  const handleCheckChange = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onCheck?.(!checked)
  }, [checked, onCheck])

  /** 格式化日期：今天显示 HH:mm，今年显示 M月D日，跨年显示 YYYY/M/D */
  const formatDate = (dateStr: string) => {
    const d = dayjs(dateStr)
    const now = dayjs()
    if (d.isSame(now, 'day')) return d.format('HH:mm')
    if (d.isSame(now, 'year')) return d.format('M月D日')
    return d.format('YYYY/M/D')
  }

  return (
    <div
      className={`
        flex items-center h-11 px-1 cursor-pointer transition-colors duration-150
        border-b border-gray-100 select-none
        ${selected
          ? 'bg-[#c2dbff]'
          : isUnread
            ? 'bg-white hover:bg-[#f2f6fc]'
            : 'bg-white hover:bg-[#f2f2f2]'
        }
      `}
      onClick={onClick}
    >
      {/* 复选框 */}
      <span className="shrink-0 w-7 flex items-center justify-center" onClick={handleCheckChange}>
        <Checkbox checked={checked} />
      </span>

      {/* 未读指示点 */}
      <span className="shrink-0 w-4 flex items-center justify-center">
        {isUnread && <span className="w-2 h-2 rounded-full bg-blue-500" />}
      </span>

      {/* 星标 */}
      <span className="shrink-0 w-6 flex items-center justify-center" onClick={handleStarClick}>
        {starred ? (
          <StarFilled className="text-amber-400 text-sm" />
        ) : (
          <StarOutlined className="text-gray-300 text-sm hover:text-amber-400" />
        )}
      </span>

      {/* 发件人 */}
      <span
        className={`
          shrink-0 w-[180px] truncate text-[13px] pr-2
          ${isUnread ? 'text-gray-900 font-bold' : 'text-gray-600 font-normal'}
        `}
      >
        {mail.from.name || mail.from.address}
      </span>

      {/* 主题 + 摘要 */}
      <div className="flex-1 min-w-0 flex items-center text-[13px]">
        <span
          className={`
            truncate
            ${isUnread ? 'text-gray-900 font-bold' : 'text-gray-700 font-normal'}
          `}
        >
          {mail.subject}
        </span>
        <span className="mx-1 text-gray-300 shrink-0">-</span>
        <span
          className={`truncate text-[12px] ${isUnread ? 'text-gray-500' : 'text-gray-400'}`}
        >
          {mail.snippet}
        </span>
      </div>

      {/* 附件图标 */}
      {mail.hasAttachments && (
        <PaperClipOutlined className="shrink-0 ml-2 text-xs text-gray-400" />
      )}

      {/* 日期 */}
      <span
        className={`
          shrink-0 w-16 text-right pl-3 text-[12px]
          ${isUnread ? 'text-gray-700 font-medium' : 'text-gray-400'}
        `}
      >
        {formatDate(mail.date)}
      </span>
    </div>
  )
}
