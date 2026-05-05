import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import AppHeader from '@/components/AppHeader'

const { Header, Content } = Layout

export default function AppLayout() {
  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center px-4 bg-white border-b border-gray-200">
        <AppHeader />
      </Header>
      <Content className="p-0 bg-gray-50">
        <Outlet />
      </Content>
    </Layout>
  )
}
