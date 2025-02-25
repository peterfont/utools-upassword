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
  timeout: 15000, // 增加超时时间到15秒
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  // 添加请求重试配置
  retry: 3, // 重试次数
  retryDelay: 1000 // 重试间隔时间
})

// 添加请求重试拦截器
axios.interceptors.response.use(undefined, async (err) => {
  const config = err.config;
  
  // 如果配置了重试
  if (config && config.retry) {
    // 设置重试计数器
    config.__retryCount = config.__retryCount || 0;
    
    // 检查是否已经达到重试次数
    if (config.__retryCount < config.retry) {
      // 增加重试计数
      config.__retryCount += 1;
      
      // 延迟重试
      await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      
      // 重试请求
      return axios(config);
    }
  }
  
  return Promise.reject(err);
});

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
    if (res.success && res.code === '200') {
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