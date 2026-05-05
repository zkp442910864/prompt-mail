/** localStorage 封装 */

/** 获取 localStorage 值 */
export function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : defaultValue
  } catch {
    return defaultValue
  }
}

/** 设置 localStorage 值 */
export function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 存储满时忽略
  }
}

/** 删除 localStorage 值 */
export function removeStorage(key: string): void {
  localStorage.removeItem(key)
}
