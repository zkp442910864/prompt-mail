import { useNavigate } from 'react-router-dom'
import { Select, Button, Space } from 'antd'
import { SettingOutlined, MailOutlined } from '@ant-design/icons'
import { useMailContext } from '@/features/mail/context/MailContext'
import { useEmailConfig } from '@/features/config/hooks/useEmailConfig'

export default function AppHeader() {
  const navigate = useNavigate()
  const { state, dispatch } = useMailContext()
  const { data: emailConfigs } = useEmailConfig()

  return (
    <div className="flex items-center justify-between w-full">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate('/inbox')}
      >
        <MailOutlined className="text-xl text-blue-600" />
        <span className="text-lg font-bold text-gray-800">Prompt-Mail</span>
      </div>

      <Space>
        <Select
          value={state.currentEmailConfigId || undefined}
          placeholder="选择邮箱"
          style={{ width: 200 }}
          onChange={(value) => dispatch({ type: 'SET_CURRENT_EMAIL_CONFIG', payload: value })}
          options={emailConfigs?.map((config) => ({
            label: `${config.account} (${
              config.type === 'aliyun' ? '阿里个人邮箱' :
              config.type === 'aliyun-enterprise' ? '阿里企业邮箱' :
              config.type === 'qq' ? 'QQ邮箱' : '自定义邮箱'
            })`,
            value: config.id,
          }))}
          allowClear
        />
        <Button
          icon={<SettingOutlined />}
          onClick={() => navigate('/settings')}
        >
          设置
        </Button>
      </Space>
    </div>
  )
}
