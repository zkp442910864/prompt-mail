import { describe, it, expect } from 'vitest'
import { success, fail, error } from '../utils/response.js'
import type { Response } from 'express'

function mockResponse(): Response {
  const res = {
    _statusCode: 200,
    _json: null as unknown,
    status(code: number) {
      res._statusCode = code
      return res
    },
    json(data: unknown) {
      res._json = data
      return res
    },
  } as unknown as Response
  return res
}

describe('response utils', () => {
  describe('success', () => {
    it('should return correct format with default message', () => {
      const res = mockResponse()
      success(res, { id: 1 })
      expect(res._json).toEqual({ code: 0, message: '操作成功', data: { id: 1 } })
    })

    it('should return correct format with custom message', () => {
      const res = mockResponse()
      success(res, 'hello', '自定义消息')
      expect(res._json).toEqual({ code: 0, message: '自定义消息', data: 'hello' })
    })
  })

  describe('fail', () => {
    it('should return correct format with default code', () => {
      const res = mockResponse()
      fail(res, '业务失败')
      expect(res._json).toEqual({ code: 1, message: '业务失败', data: null })
    })

    it('should return correct format with custom code', () => {
      const res = mockResponse()
      fail(res, '参数错误', 400)
      expect(res._json).toEqual({ code: 400, message: '参数错误', data: null })
    })
  })

  describe('error', () => {
    it('should set status and return correct format for 500', () => {
      const res = mockResponse()
      error(res, '服务器错误', 500)
      expect(res._statusCode).toBe(500)
      expect(res._json).toEqual({ code: 500, message: '服务器错误', data: null })
    })

    it('should set status 400 for 4xx errors', () => {
      const res = mockResponse()
      error(res, '未找到', 404)
      expect(res._statusCode).toBe(404)
      expect(res._json).toEqual({ code: 404, message: '未找到', data: null })
    })

    it('should default to 500 for non-HTTP error codes', () => {
      const res = mockResponse()
      error(res, '奇怪的错误', 999)
      expect(res._statusCode).toBe(500)
      expect(res._json).toEqual({ code: 999, message: '奇怪的错误', data: null })
    })
  })
})
