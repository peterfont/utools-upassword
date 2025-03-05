import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import qs from 'qs'

// 修改接口返回格式定义
interface ApiResponse<T = any> {
  code: string | number
  msg: string | null
  data: T
  version?: string
  timestamp?: number | null
  sign?: string | null
  success: boolean
  fail: boolean
}

// 扩展 AxiosRequestConfig 类型
declare module 'axios' {
  interface AxiosRequestConfig {
    contentType?: 'json' | 'form' | 'multipart'
  }
}

const contentTypeMap = {
  json: 'application/json',
  form: 'application/x-www-form-urlencoded',
  multipart: 'multipart/form-data'
} as const

const request = axios.create({
  timeout: 5000,
  headers: {
    'Content-Type': contentTypeMap.form
  }
})

// 修改请求拦截器
request.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      }
    }

    const contentType = (config as AxiosRequestConfig & { contentType?: keyof typeof contentTypeMap }).contentType || 'form'
    
    if (config.headers) {
      config.headers['Content-Type'] = contentTypeMap[contentType]
    }

    if (config.method?.toLowerCase() === 'post' || config.method?.toLowerCase() === 'put') {
      switch (contentType) {
        case 'json':
          config.data = config.params || config.data
          config.params = undefined
          break
        case 'form':
          config.data = qs.stringify(config.params || config.data)
          config.params = undefined
          break
        case 'multipart':
          // FormData 不需要特殊处理
          break
      }
    }

    return config
  },
  error => Promise.reject(error)
)

// 修改响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    
    // 使用 === 进行严格比较，同时处理 string 和 number 类型
    if (res.success && (res.code === '00000' || res.code === 0)) {
      return res
    }
    
    const errorMsg = res.msg || '操作失败'
    ElMessage.error(errorMsg)
    return Promise.reject(new Error(errorMsg))
  },
  error => {
    const errorMsg = error.response?.data?.msg || '请求失败'
    ElMessage.error(errorMsg)
    return Promise.reject(error)
  }
)

export default request