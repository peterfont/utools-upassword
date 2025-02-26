// 定义数据记录类型
export interface DataRecord {
  id?: number
  userId?: number
  username: string
  password: string
  url: string
  timestamp?: string
}

// 定义接口类型
export interface AccountRecord {
  id: number
  username: string
  password: string
  url: string
  userId: number
  timestamp?: string
  showPassword?: boolean
}

// 服务器响应类型
export interface ServerResponse<T> {
  code: number
  message: string
  data: T
}

// 分页响应类型
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}