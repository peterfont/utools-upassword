import axios, { AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import qs from 'qs'

// 定义接口返回格式
interface ApiResponse<T = any> {
  code: string
  msg: string | null
  data: T
  version: string
  timestamp: number | null
  sign: string | null
  success: boolean
  fail: boolean
}

// 扩展 AxiosRequestConfig 类型
declare module 'axios' {
  interface AxiosRequestConfig {
    contentType?: 'json' | 'form' | 'multipart'
  }
}

// 定义请求配置接口
interface RequestConfig {
  contentType?: 'json' | 'form' | 'multipart'
  // ...其他配置
}

const contentTypeMap = {
  json: 'application/json',
  form: 'application/x-www-form-urlencoded',
  multipart: 'multipart/form-data'
}

const request = axios.create({
  timeout: 5000,
  headers: {
    'Content-Type': contentTypeMap.form  // 默认使用 form 格式
  }
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = token
    }

    // 根据 contentType 处理请求数据
    const contentType = (config as any).contentType || 'form'
    config.headers['Content-Type'] = contentTypeMap[contentType]

    if (config.method === 'post' || config.method === 'put') {
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

request.interceptors.response.use(
  response => {
    // response.data 才是真正的接口返回内容
    const res = response.data as ApiResponse
    
    // 判断业务状态码
    if (res.success && res.code === '00000') {
      // 直接返回 data 数据
      return res
    }
    
    // 业务失败
    ElMessage.error(res.msg || '操作失败')
    return Promise.reject(new Error(res.msg || '操作失败'))
  },
  error => {
    // 网络错误等
    ElMessage.error(error.response?.data?.msg || '请求失败')
    return Promise.reject(error)
  }
)

export default request