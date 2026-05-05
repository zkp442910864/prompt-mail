import axios from 'axios'
import { message } from 'antd'

/** Axios 实例 */
const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // AI 生成接口使用更长超时
    if (config.url?.includes('/ai/generate')) {
      config.timeout = 120000
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { code, message: msg } = response.data
    if (code !== 0) {
      // 业务错误：显示错误提示
      message.error(msg || '请求失败')
      return Promise.reject(new Error(msg || '请求失败'))
    }
    return response.data
  },
  (err) => {
    // HTTP 错误或网络错误
    if (err.code === 'ECONNABORTED' || err.code === 'ERR_CANCELED') {
      message.error('请求超时，请稍后重试')
    } else if (!err.response) {
      message.error('网络连接失败，请检查后端服务是否启动')
    } else {
      const status = err.response?.status
      const msg = err.response?.data?.message || err.message || '网络错误'
      if (status === 404) {
        message.error('请求的资源不存在')
      } else if (status === 500) {
        message.error(`服务器错误: ${msg}`)
      } else {
        message.error(msg)
      }
    }
    return Promise.reject(err)
  },
)

export default request
