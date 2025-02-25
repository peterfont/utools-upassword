import axios from 'axios'
import { ElMessage } from 'element-plus'
import qs from 'qs'

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
  response => response.data,
  error => {
    ElMessage.error(error.response?.data?.message || '请求失败')
    return Promise.reject(error)  
  }
)

export default request