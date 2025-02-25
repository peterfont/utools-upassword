import request from '@/utils/request'

// 定义响应类型
interface ServerResponseEntityString {
  code: string
  msg: string | null
  data: string
  version: string
  timestamp: number | null
  sign: string | null
  success: boolean
  fail: boolean
}

// 登录/注册参数类型
export interface LoginData {
  username: string
  password: string
}

// 登录
export const login = (data: LoginData) => {
  return request<ServerResponseEntityString>({
    url: '/auth/login',
    method: 'post',
    params: data
  })
}

// 注册
export const register = (data: LoginData) => {
  return request<ServerResponseEntityString>({
    url: '/auth/register',
    method: 'post',
    params: data
  })
}

// 获取用户信息
export const getUserInfo = () => {
  return request({
    url: '/api/user/info',
    method: 'get'
  })
}

// 退出登录
export const logout = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    return Promise.reject(new Error('未登录'))
  }
  
  return request<ServerResponseEntityString>({
    url: '/auth/logout',
    method: 'post',
    params: { token }
  })
}