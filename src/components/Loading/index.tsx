import { Spin } from 'antd'

interface LoadingProps {
  tip?: string
}

export default function Loading({ tip = '加载中...' }: LoadingProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-200px">
      <Spin size="large" tip={tip}>
        <div className="p-8" />
      </Spin>
    </div>
  )
}
