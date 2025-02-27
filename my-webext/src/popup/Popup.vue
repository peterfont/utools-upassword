<script setup lang="ts">
import { ref } from 'vue'
// 修正：从正确的模块导入sendMessage
import { sendMessage } from 'webext-bridge/popup'
import { storageDemo } from '~/logic/storage'

// 消息提示相关状态
const messageVisible = ref(false)
const messageType = ref('')
const messageText = ref('')

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

function openOptionsPage() {
  browser.runtime.openOptionsPage()
}

async function requestNotificationPermission() {
  try {
    const response = await sendMessage('request-notification-permission', {}, { context: 'background' })
    if (response.granted) {
      // 更新UI，表明权限已授予
      showMessage('success', '通知功能已启用')
    }
    else {
      // 提示用户重要功能可能受到影响
      showMessage('warning', '通知功能未启用，密码安全提醒将无法显示')
    }
  }
  catch (error) {
    console.error('请求权限失败:', error)
  }
}
</script>

<template>
  <main class="w-[300px] px-4 py-5 text-center text-gray-700">
    <!-- 消息提示区域 -->
    <div 
      v-if="messageVisible" 
      class="fixed top-2 left-1/2 transform -translate-x-1/2 p-2 rounded shadow-md z-50 text-sm"
      :class="{
        'bg-green-100 text-green-800': messageType === 'success',
        'bg-yellow-100 text-yellow-800': messageType === 'warning',
        'bg-red-100 text-red-800': messageType === 'error'
      }"
    >
      {{ messageText }}
    </div>
    
    <Logo />
    <div>Popup</div>
    <SharedSubtitle />
    <button 
      class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" 
      @click="requestNotificationPermission"
    >
      启用通知功能
    </button>
    <button class="btn mt-2" @click="openOptionsPage">
      Open Options
    </button>
    <div class="mt-2">
      <span class="opacity-50">Storage:</span> {{ storageDemo }}
    </div>
  </main>
</template>
