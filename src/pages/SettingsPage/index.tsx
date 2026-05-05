import { Row, Col } from 'antd'
import EmailConfigCard from '@/features/config/components/EmailConfigCard'
import AiConfigCard from '@/features/config/components/AiConfigCard'

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h2 className="mb-6 text-xl font-bold">设置</h2>
      <Row gutter={24}>
        <Col span={12}>
          <EmailConfigCard />
        </Col>
        <Col span={12}>
          <AiConfigCard />
        </Col>
      </Row>
    </div>
  )
}
