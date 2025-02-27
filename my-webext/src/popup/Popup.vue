<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { sendMessage } from 'webext-bridge/popup'
import browser from 'webextension-polyfill'
import { storageDemo } from '~/logic/storage'
import { type AppConfig, loadConfig } from '~/config'

// 消息提示相关状态
const messageVisible = ref(false)
const messageType = ref('')
const messageText = ref('')

// 登录相关状态
const isLoggedIn = ref(false)
const username = ref('')
const passwordCount = ref(0)
const isSyncing = ref(false)

// 应用配置
const config = ref<AppConfig | null>(null)

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
 * 初始化应用配置
 */
async function initConfig() {
  try {
    config.value = await loadConfig()
  }
  catch (error) {
    console.error('初始化配置失败:', error)
  }
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
    const response = await sendMessage('request-notification-permission', {}, { context: 'background' })
    if (response.granted) {
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
 * 检查登录状态
 */
async function checkLoginStatus() {
  try {
    const result = await sendMessage('check-login-status', {}, { context: 'background' })
    isLoggedIn.value = result.isLoggedIn
    username.value = result.username || ''
  }
  catch (error) {
    console.error('检查登录状态失败:', error)
    isLoggedIn.value = false
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
    // 使用配置模块中的登录URL
    if (!config.value)
      await initConfig()

    await browser.tabs.create({
      url: config.value?.loginUrl || 'https://account.password-manager.example.com/login',
    })
    window.close() // 关闭弹窗
  }
  catch (error) {
    console.error('打开登录页面失败:', error)
    showMessage('error', '打开登录页面失败')
  }
}

/**
 * 处理登出
 */
async function handleLogout() {
  try {
    await sendMessage('logout', {}, { context: 'background' })
    isLoggedIn.value = false
    username.value = ''
    showMessage('success', '已成功退出登录')
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
    const result = await sendMessage('sync-passwords', {}, { context: 'background' })

    if (result.success) {
      showMessage('success', '密码同步成功')
    }
    else {
      showMessage('error', `同步失败: ${result.error || '未知错误'}`)
    }
  }
  catch (error) {
    console.error('同步密码失败:', error)
    showMessage('error', '同步密码失败')
  }
  finally {
    isSyncing.value = false
  }
}

/**
 * 打开密码管理页面
 */
function openPasswordManager() {
  if (!config.value) {
    initConfig().then(() => {
      browser.tabs.create({
        url: config.value?.passwordManagerUrl || 'https://account.password-manager.example.com/manager',
      })
    })
  }
  else {
    browser.tabs.create({
      url: config.value.passwordManagerUrl,
    })
  }
}

// 页面加载时初始化
onMounted(async () => {
  // 首先加载配置
  await initConfig()
  // 然后检查登录状态和密码数量
  await checkLoginStatus()
  await getPasswordCount()
})
</script>

<template>
  <main class="w-[300px] p-4 text-gray-700">
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
          启用通知提醒
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
