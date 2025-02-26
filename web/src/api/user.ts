import request from '@/utils/request'
import type { ServerResponse } from '@/types/account'

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

// 登录参数接口
export interface LoginData {
  username: string
  password: string
}

// 登录接口
export const login = (data: LoginData) => {
  return request<ServerResponse<string>>({
    url: '/auth/login',
    method: 'post',
    contentType: 'form',
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
    url: '/auth/getUserInfo',
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