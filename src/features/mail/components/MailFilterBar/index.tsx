import { Segmented, Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useMailContext } from '../../context/MailContext'
import type { MailFilter } from '@/types/mail'

const FILTER_OPTIONS: Array<{ label: string; value: MailFilter }> = [
  { label: '全部', value: 'all' },
  { label: '未读', value: 'unread' },
  { label: '已读', value: 'read' },
]

interface MailFilterBarProps {
  onRefresh?: () => void
  loading?: boolean
}

export default function MailFilterBar({ onRefresh, loading }: MailFilterBarProps) {
  const { state, dispatch } = useMailContext()

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
      <Segmented
        options={FILTER_OPTIONS}
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
