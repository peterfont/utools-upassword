<script setup lang="ts">
import { onMounted, ref } from 'vue'
import browser from 'webextension-polyfill'

// 消息提示相关状态
const messageVisible = ref(false)
const messageType = ref('')
const messageText = ref('')

// 登录相关状态
const isLoggedIn = ref(false)
const username = ref('')
const passwordCount = ref(0)
const isSyncing = ref(false)
const iframeLoaded = ref(false)

/**
 * 显示消息提示
 * @param type 消息类型：success, warning, error
 * @param text 消息内容
 */
function showMessage(type: 'success' | 'warning' | 'error', text: string) {
  messageType.value = type
  messageText.value = text
  messageVisible.value = true
  // 3秒后自动隐藏
  setTimeout(() => {
    messageVisible.value = false
  }, 3000)
}

/**
 * 打开选项页
 */
function openOptionsPage() {
  browser.runtime.openOptionsPage()
}

/**
 * 请求通知权限
 */
async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      showMessage('success', '通知功能已启用')
    }
    else {
      showMessage('warning', '通知功能未启用，密码安全提醒将无法显示')
    }
  }
  catch (error) {
    console.error('请求权限失败:', error)
    showMessage('error', '请求权限失败')
  }
}

/**
 * 获取密码数量
 */
async function getPasswordCount() {
  try {
    const result = await browser.storage.local.get('loginRecords')
    const records = result.loginRecords || []
    passwordCount.value = records.length
  }
  catch (error) {
    console.error('获取密码数量失败:', error)
  }
}

/**
 * 处理登录
 */
async function handleLogin() {
  try {
    await browser.tabs.create({
      url: 'http://localhost:3000/login',
    })
    window.close() // 关闭弹窗
  }
  catch {
    showMessage('error', '打开登录页面失败')
  }
}

/**
 * 处理登出
 */
async function handleLogout() {
  try {
    // 向web端发送登出消息
    if (iframeLoaded.value) {
      const iframe = document.getElementById('extension-bridge') as HTMLIFrameElement
      iframe.contentWindow?.postMessage({ type: 'LOGOUT', source: 'extension' }, '*')
      
      // 等待web端处理后再更新状态
      setTimeout(() => {
        isLoggedIn.value = false
        username.value = ''
        showMessage('success', '已成功退出登录')
      }, 500)
    } else {
      showMessage('error', '无法连接到服务器')
    }
  }
  catch (error) {
    console.error('登出失败:', error)
    showMessage('error', '登出失败')
  }
}

/**
 * 同步密码到云端
 */
async function syncPasswords() {
  if (!isLoggedIn.value) {
    showMessage('warning', '请先登录')
    return
  }

  try {
    isSyncing.value = true
    
    // 获取本地保存的密码
    const result = await browser.storage.local.get('loginRecords')
    const records = result.loginRecords || []
    
    // 向web端发送同步请求
    if (iframeLoaded.value) {
      const iframe = document.getElementById('extension-bridge') as HTMLIFrameElement
      iframe.contentWindow?.postMessage({ 
        type: 'SYNC_PASSWORDS', 
        source: 'extension',
        data: { passwords: records }
      }, '*')
      
      // 显示临时成功信息，实际结果应该由web端返回
      showMessage('success', '正在同步密码...')
    } else {
      throw new Error('无法连接到服务器')
    }
  }
  catch (error) {
    console.error('同步密码失败:', error)
    showMessage('error', `同步密码失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
  finally {
    setTimeout(() => {
      isSyncing.value = false
    }, 1000)
  }
}

/**
 * 打开密码管理页面
 */
function openPasswordManager() {
  browser.tabs.create({
    url: 'http://localhost:3000/account',
  })
}

// 处理来自web端的消息
function handleWebMessage(event: MessageEvent) {
  // 忽略不是来自我们iframe的消息
  if (!event.source || event.source !== (document.getElementById('extension-bridge') as HTMLIFrameElement).contentWindow) {
    return
  }

  console.log('收到Web消息:', event.data)
  
  switch (event.data.type) {
    case 'USER_INFO':
      const userInfo = event.data.data
      if (userInfo) {
        isLoggedIn.value = true
        username.value = userInfo.username
      } else {
        isLoggedIn.value = false
        username.value = ''
      }
      break
      
    case 'IFRAME_LOADED':
      iframeLoaded.value = true
      fetchUserInfo()
      break
      
    case 'SYNC_RESULT':
      isSyncing.value = false
      if (event.data.success) {
        showMessage('success', `同步成功! 上传: ${event.data.stats?.uploaded || 0}, 下载: ${event.data.stats?.downloaded || 0}`)
        // 更新本地密码数量
        getPasswordCount()
      } else {
        showMessage('error', `同步失败: ${event.data.error || '未知错误'}`)
      }
      break
      
    case 'LOGOUT_RESULT':
      if (event.data.success) {
        isLoggedIn.value = false
        username.value = ''
        showMessage('success', '已成功退出登录')
      } else {
        showMessage('error', `登出失败: ${event.data.error || '未知错误'}`)
      }
      break
  }
}

// 主动查询用户信息
function fetchUserInfo() {
  if (iframeLoaded.value) {
    const iframe = document.getElementById('extension-bridge') as HTMLIFrameElement
    iframe.contentWindow?.postMessage({ type: 'GET_USER_INFO', source: 'extension' }, '*')
  } else {
    console.warn('iframe未加载完成，无法获取用户信息')
  }
}

// 页面加载时初始化
onMounted(async () => {
  // 添加消息监听
  window.addEventListener('message', handleWebMessage)
  // 获取密码数量
  await getPasswordCount()

  // iframe加载可能需要时间，如果10秒后还未收到IFRAME_LOADED消息，显示错误
  setTimeout(() => {
    if (!iframeLoaded.value) {
      console.error('iframe加载超时')
      showMessage('warning', '无法连接到服务器，部分功能可能不可用')
    }
  }, 10000)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('message', handleWebMessage)
})
</script>

<template>
  <main class="w-[300px] p-4 text-gray-700">
    <!-- 隐藏的iframe用于与web端通信 -->
    <iframe
      id="extension-bridge"
      src="http://localhost:3000/extension-bridge"
      style="display: none; width: 0; height: 0; border: 0;"
      sandbox="allow-scripts allow-same-origin"
    />

    <!-- 消息提示区域 -->
    <div
      v-if="messageVisible"
      class="fixed top-2 left-1/2 transform -translate-x-1/2 p-2 rounded shadow-md z-50 text-sm"
      :class="{
        'bg-green-100 text-green-800': messageType === 'success',
        'bg-yellow-100 text-yellow-800': messageType === 'warning',
        'bg-red-100 text-red-800': messageType === 'error',
      }"
    >
      {{ messageText }}
    </div>

    <!-- 头部区域 -->
    <div class="text-center mb-4">
      <h1 class="text-xl font-bold">
        密码安全助手
      </h1>
      <p class="text-sm text-gray-500">
        用户密码风险检测与保护
      </p>
    </div>

    <!-- 登录状态区域 -->
    <div class="bg-gray-50 p-3 rounded-md mb-4">
      <div v-if="isLoggedIn" class="flex justify-between items-center">
        <div>
          <div class="font-medium">
            已登录为
          </div>
          <div class="text-blue-600">
            {{ username }}
          </div>
        </div>
        <button
          class="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
          @click="handleLogout"
        >
          退出登录
        </button>
      </div>
      <div v-else class="flex justify-between items-center">
        <div class="text-gray-600">
          未登录
        </div>
        <button
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          @click="handleLogin"
        >
          去登录
        </button>
      </div>
    </div>

    <!-- 密码同步区域 -->
    <div class="bg-gray-50 p-3 rounded-md mb-4">
      <div class="flex justify-between items-center mb-2">
        <div>
          <div class="font-medium">
            本地密码
          </div>
          <div class="text-sm text-gray-500">
            已保存 {{ passwordCount }} 个密码
          </div>
        </div>
        <button
          class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          :disabled="!isLoggedIn || isSyncing"
          @click="syncPasswords"
        >
          {{ isSyncing ? '同步中...' : '同步到云端' }}
        </button>
      </div>
      <div v-if="isLoggedIn" class="text-right">
        <button
          class="text-sm text-blue-500 hover:underline"
          @click="openPasswordManager"
        >
          管理我的密码 →
        </button>
      </div>
    </div>

    <!-- 设置区域 -->
    <div class="grid grid-cols-2 gap-3">
      <button
        class="bg-gray-100 p-3 rounded text-center hover:bg-gray-200"
        @click="openOptionsPage"
      >
        <div class="material-icons text-gray-700 mb-1">
          设置
        </div>
        <div class="text-sm">
          密码规则设置
        </div>
      </button>

      <button
        class="bg-gray-100 p-3 rounded text-center hover:bg-gray-200"
        @click="requestNotificationPermission"
      >
        <div class="material-icons text-gray-700 mb-1">
          通知
        </div>
        <div class="text-sm">
          开启通知提醒
        </div>
      </button>
    </div>
  </main>
</template>

<style>
.material-icons {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
}
</style>
