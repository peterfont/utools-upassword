<template>
  <div class="extension-bridge">
    <h1>Extension Bridge</h1>
    <div v-if="userInfo">
      <p>当前登录用户：{{ userInfo.username }}</p>
      <p>登录状态：已登录</p>
    </div>
    <div v-else>
      <p>登录状态：未登录</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'
import axios from 'axios'

const userInfo = ref(null)

// 检查本地存储中的token和用户信息
function checkLoginStatus() {
  const token = localStorage.getItem('token')
  const storedUserInfo = localStorage.getItem('userInfo')

  if (token && storedUserInfo) {
    try {
      const parsedUserInfo = JSON.parse(storedUserInfo)
      // 只保留必要的用户信息字段
      userInfo.value = {
        username: parsedUserInfo.username,
        id: parsedUserInfo.id,
        email: parsedUserInfo.email
      }
      // 向插件发送用户信息
      window.parent.postMessage({
        type: 'USER_INFO',
        data: {
          username: userInfo.value.username,
          id: userInfo.value.id,
          email: userInfo.value.email
        }
      }, '*')
    } catch (error) {
      console.error('解析用户信息失败:', error)
      clearLoginInfo()
    }
  } else {
    clearLoginInfo()
  }
}

// 清除登录信息
function clearLoginInfo() {
  userInfo.value = null
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  // 向插件发送未登录状态
  window.parent.postMessage({
    type: 'USER_INFO',
    data: null
  }, '*')
}

// 处理登出请求
async function handleLogout() {
  try {
    // 如果有API，调用登出API
    if (userInfo.value) {
      try {
        const token = localStorage.getItem('token')
        await axios.post('/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch (apiError) {
        console.warn('API登出失败，但会继续本地登出', apiError)
      }
    }
    
    // 清除本地登录信息
    clearLoginInfo()
    
    // 向扩展发送登出成功消息
    window.parent.postMessage({
      type: 'LOGOUT_RESULT',
      success: true
    }, '*')
  } catch (error) {
    console.error('登出处理失败:', error)
    window.parent.postMessage({
      type: 'LOGOUT_RESULT',
      success: false,
      error: error.message || '未知错误'
    }, '*')
  }
}

// 处理密码同步请求
async function handlePasswordSync(passwords) {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('未登录，无法同步')
    }

    // 调用API同步密码
    const response = await axios.post('/api/passwords/sync', {
      passwords,
      deviceId: getDeviceId()
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    // 发送同步结果回扩展
    window.parent.postMessage({
      type: 'SYNC_RESULT',
      success: true,
      stats: response.data.stats || {
        uploaded: passwords.length,
        downloaded: 0
      }
    }, '*')
  } catch (error) {
    console.error('密码同步失败:', error)
    window.parent.postMessage({
      type: 'SYNC_RESULT',
      success: false,
      error: error.message || '同步失败'
    }, '*')
  }
}

// 获取设备ID
function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId')
  if (!deviceId) {
    deviceId = `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('deviceId', deviceId)
  }
  return deviceId
}

// 监听本地存储变化
function handleStorageChange(event) {
  if (event.key === 'token' || event.key === 'userInfo') {
    checkLoginStatus()
  }
}

// 监听插件消息
function handleExtensionMessage(event) {
  // 验证消息来源
  if (!event.source || event.source !== window.parent) {
    return
  }

  console.log('收到扩展消息:', event.data)
  
  // 确保消息来自扩展
  if (event.data.source !== 'extension') {
    return
  }
  
  switch (event.data.type) {
    case 'GET_USER_INFO':
      checkLoginStatus()
      break
      
    case 'LOGOUT':
      handleLogout()
      break
      
    case 'SYNC_PASSWORDS':
      if (event.data.data && event.data.data.passwords) {
        handlePasswordSync(event.data.data.passwords)
      } else {
        window.parent.postMessage({
          type: 'SYNC_RESULT',
          success: false,
          error: '无效的密码数据'
        }, '*')
      }
      break
  }
}

// 初始化时添加事件监听
onMounted(() => {
  window.addEventListener('storage', handleStorageChange)
  window.addEventListener('message', handleExtensionMessage)
  
  // 通知扩展iframe已加载
  window.parent.postMessage({
    type: 'IFRAME_LOADED'
  }, '*')
  
  // 初始检查登录状态
  checkLoginStatus()
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
  window.removeEventListener('message', handleExtensionMessage)
})
</script>

<style scoped>
.extension-bridge {
  padding: 20px;
  text-align: center;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

p {
  margin: 0.5rem 0;
}
</style>