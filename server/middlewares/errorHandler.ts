import type { Request, Response, NextFunction } from 'express'
import { error } from '../utils/response.js'

/** 全局错误处理中间件 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error('[Error Handler] message:', err.message, 'authenticationFailed:', (err as any).authenticationFailed)
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack)
  }
  error(res, `服务器内部错误: ${err.message}`, 500)
}
