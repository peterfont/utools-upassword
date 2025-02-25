// 定义数据记录类型
export interface DataRecord {
  id?: number
  userId?: number
  username: string
  password: string
  url: string
  timestamp?: string
}

// 定义服务器响应类型
export interface ServerResponse<T> {
  code: string
  msg: string
  data: T
  version?: string
  timestamp?: number
  sign?: string
  success: boolean
  fail: boolean
}

// 定义分页响应类型
export interface PageResponse<T> {
  totalPages: number
  totalElements: number
  size: number
  content: T[]
  number: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}