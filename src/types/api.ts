/** 统一响应格式 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}
