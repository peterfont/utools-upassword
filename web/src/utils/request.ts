import axios from 'axios'
import { ElMessage } from 'element-plus'
import qs from 'qs'

// 定义接口返回格式
interface ApiResponse<T = any> {
  code: string
  msg: string
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
    'Content-Type': 'application/x-www-form-urlencoded' // 设置表单格式
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
      config.data = qs.stringify(config.data)
    }
    if (config.method === 'get' || config.method === 'delete') {
      config.params = config.data
    }

    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => {
    const res = response.data as ApiResponse
    
    // 判断业务状态码
    if (res.success && res.code === '00000') {
      return response
    }
    
    // 业务失败
    // ElMessage.error(res.msg || '操作失败')
    return Promise.reject(new Error(res.msg || '操作失败'))
  },
  error => {
    // 网络错误等
    ElMessage.error(error.response?.data?.msg || '请求失败')
    return Promise.reject(error)
  }
)

export default request