import request from '@/utils/request'
import type { DataRecord, ServerResponse, PageResponse } from '@/types/account'

interface QueryParams {
  page?: number
  size?: number
  username?: string
  url?: string
}

// 获取账户列表
export const getAccountList = (params: QueryParams = {}) => {
  return request<ServerResponse<PageResponse<DataRecord>>>({
    url: '/api/data',
    method: 'get',
    params: {
      page: params.page || 0,
      size: params.size || 10,
      username: params.username,
      url: params.url
    }
  })
}

// 添加账户
export const addAccount = (data: DataRecord) => {
  return request<ServerResponse<DataRecord>>({
    url: '/api/data',
    method: 'post',
    data
  })
}

// 更新账户
export const updateAccount = (data: DataRecord) => {
  return request<ServerResponse<DataRecord>>({
    url: '/api/data/',
    method: 'put', 
    data
  })
}

// 删除账户
export const deleteAccount = (id: number) => {
  return request<ServerResponse<string>>({
    url: `/api/data/${id}`,
    method: 'delete'
  })
}

const loadData = async () => {
  try {
    loading.value = true
    const res = await getAccountList()
    accountList.value = res.data.content
  } finally {
    loading.value = false
  }
}