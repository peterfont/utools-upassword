import axios from 'axios'
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

const request = axios.create({
  timeout: 5000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = token
    }

    // 将请求参数转换为表单格式
    if (config.method === 'post' || config.method === 'put') {
      config.data = qs.stringify(config.params || config.data)
      // 清空 params,避免参数重复
      config.params = undefined 
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