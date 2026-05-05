import type { Response } from 'express'

// 统一响应格式
interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 成功响应 */
export function success<T>(res: Response, data: T, message = '操作成功') {
  return res.json({ code: 0, message, data } satisfies ApiResponse<T>)
}

/** 业务失败响应 */
export function fail(res: Response, message: string, code = 1) {
  return res.json({ code, message, data: null } satisfies ApiResponse<null>)
}

/** 服务器错误响应 */
export function error(res: Response, message: string, code = 500) {
  return res.status(code >= 400 && code < 600 ? code : 500).json({
    code,
    message,
    data: null,
  } satisfies ApiResponse<null>)
}
