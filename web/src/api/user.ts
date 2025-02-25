import request from '@/utils/request'

export interface LoginData {
  username: string
  password: string
}

export const login = (data: LoginData) => {
  return request({
    url: '/auth/login',
    method: 'post',
    params: data
  })
}

export const register = (data: LoginData) => {
  return request({
    url: '/auth/register',
    method: 'post',
    params: data
  })
}