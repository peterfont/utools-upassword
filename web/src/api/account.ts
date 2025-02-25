import request from '@/utils/request'
import type { AccountRecord } from '@/types/account'

export const getAccountList = () => {
  return request<AccountRecord[]>({
    url: '/api/data',
    method: 'get'
  })
}

export const addAccount = (data: AccountRecord) => {
  return request<AccountRecord>({
    url: '/api/data',
    method: 'post',
    data: { dataRecord: data }
  })
}

export const updateAccount = (data: AccountRecord) => {
  return request<AccountRecord>({
    url: '/api/data/',
    method: 'put',
    data: { dataRecord: data }
  })
}

export const deleteAccount = (id: number | string) => {
  return request({
    url: '/api/data/',
    method: 'delete',
    data: { id }
  })
}