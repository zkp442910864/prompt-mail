import type { Request, Response, NextFunction } from 'express'

/** 请求日志中间件 */
export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  const start = Date.now()
  _res.on('finish', () => {
    const duration = Date.now() - start
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${_res.statusCode} ${duration}ms`,
    )
  })
  next()
}
