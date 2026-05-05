import { Segmented, Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useMailContext } from '../../context/MailContext'
import type { MailFilter } from '@/types/mail'

interface MailFilterBarProps {
  onRefresh?: () => void
  loading?: boolean
  unreadCount?: number
}

export default function MailFilterBar({ onRefresh, loading, unreadCount = 0 }: MailFilterBarProps) {
  const { state, dispatch } = useMailContext()

  const filterOptions: Array<{ label: string; value: MailFilter }> = [
    { label: '全部', value: 'all' },
    { label: unreadCount > 0 ? `未读(${unreadCount})` : '未读', value: 'unread' },
    { label: '已读', value: 'read' },
  ]

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
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
  )
}
