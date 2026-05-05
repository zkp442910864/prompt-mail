import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const store: Record<string, string> = {}

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k])
})

vi.stubGlobal('localStorage', {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
  clear: () => Object.keys(store).forEach((k) => delete store[k]),
  get length() { return Object.keys(store).length },
  key: (_index: number) => null,
})

import { getStorage, setStorage, removeStorage } from '../utils/localStorage'

describe('localStorage utils', () => {
  it('should set and get a value', () => {
    setStorage('test-key', { name: 'hello' })
    expect(getStorage('test-key', null)).toEqual({ name: 'hello' })
  })

  it('should handle JSON serialization/deserialization', () => {
    setStorage('nums', [1, 2, 3])
    expect(getStorage<number[]>('nums', [])).toEqual([1, 2, 3])
  })

  it('should return defaultValue for non-existent key', () => {
    expect(getStorage('nonexistent', 'default')).toBe('default')
  })

  it('should remove a value', () => {
    setStorage('to-remove', 'value')
    removeStorage('to-remove')
    expect(getStorage('to-remove', null)).toBeNull()
  })

  it('should handle string values', () => {
    setStorage('str', 'hello')
    expect(getStorage('str', '')).toBe('hello')
  })
})
