import { Segmented, Button, Space, Input } from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useMailContext } from '../../context/MailContext'
import type { MailFilter } from '@/types/mail'

interface MailFilterBarProps {
  onRefresh?: () => void
  loading?: boolean
  unreadCount?: number
  keyword?: string
  onKeywordChange?: (keyword: string) => void
}

export default function MailFilterBar({
  onRefresh,
  loading,
  unreadCount = 0,
  keyword,
  onKeywordChange,
}: MailFilterBarProps) {
  const { state, dispatch } = useMailContext()

  const filterOptions: Array<{ label: string; value: MailFilter }> = [
    { label: '全部', value: 'all' },
    { label: unreadCount > 0 ? `未读(${unreadCount})` : '未读', value: 'unread' },
    { label: '已读', value: 'read' },
  ]

  return (
    <div className="border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-2">
        <Segmented
          options={filterOptions}
          value={state.filter}
          onChange={(value) => dispatch({ type: 'SET_FILTER', payload: value as MailFilter })}
        />
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
            size="small"
          >
            刷新
          </Button>
        </Space>
      </div>
      {/* 搜索栏 */}
      <div className="px-3 pb-2">
        <Input
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="搜索邮件标题或正文..."
          allowClear
          size="small"
          value={keyword}
          onChange={(e) => onKeywordChange?.(e.target.value)}
        />
      </div>
    </div>
  )
}
