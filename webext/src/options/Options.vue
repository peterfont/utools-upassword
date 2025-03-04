<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { sendMessage } from 'webext-bridge/options'
import logo from '~/assets/logo.svg'
import { type AppConfig, defaultConfig, loadConfig, saveConfig } from '~/config'

const messageVisible = ref(false)
const messageType = ref('')
const messageText = ref('')

function showMessage(type: 'success' | 'error', text: string) {
  messageType.value = type
  messageText.value = text
  messageVisible.value = true
  setTimeout(() => {
    messageVisible.value = false
  }, 3000)
}

const passwordRules = ref({
  minLength: 8,
  maxLength: 20,
  minDigits: 1,
  minSpecialChars: 1,
  minUpperCaseLetters: 1,
  minLowerCaseLetters: 1,
})

async function saveSettings() {
  try {
    // 使用 webext-bridge 发送消息到背景页面
    const response = await sendMessage('save-password-rules', { passwordRules: passwordRules.value }, { context: 'background' },
    )

    if (response && response.success) {
      showMessage('success', '设置保存成功')
    }
    else {
      showMessage('error', '保存设置失败')
    }
  }
  catch (error) {
    console.error('保存设置失败:', error)
    showMessage('error', '保存设置失败')
  }
}

// 初始化加载已保存的设置
async function loadSettings() {
  try {
    // 使用 webext-bridge 从背景页面获取设置
    const response = await sendMessage('get-password-rules', {}, { context: 'background' })

    if (response && response.passwordRules) {
      passwordRules.value = response.passwordRules
    }
  }
  catch (error) {
    console.error('加载设置失败:', error)
  }
}

// 应用配置
const appConfig = ref({ ...defaultConfig })

// 加载所有设置
async function loadAllSettings() {
  try {
    // 加载密码规则
    await loadSettings()
    // 加载应用配置
    appConfig.value = await loadConfig()
  }
  catch (error) {
    console.error('加载设置失败:', error)
  }
}

// 保存所有设置
async function saveAllSettings() {
  try {
    // 保存密码规则
    await saveSettings()

    // 保存应用配置
    await saveConfig(appConfig.value)

    showMessage('success', '所有设置保存成功')
  }
  catch (error) {
    console.error('保存设置失败:', error)
    showMessage('error', '保存设置失败')
  }
}

onMounted(async () => {
  await loadAllSettings()
})

loadSettings()
</script>

<template>
  <main class="container">
    <div v-if="messageVisible" class="message" :class="messageType">
      {{ messageText }}
    </div>
    <div class="header">
      <img :src="logo" class="logo" alt="extension icon">
      <h1>密码管理器设置</h1>
    </div>

    <div class="settings-section">
      <h2>密码强度标准设置</h2>
      <div class="settings-group">
        <div class="form-item">
          <label for="minLength">最小长度：</label>
          <input
            id="minLength"
            v-model="passwordRules.minLength"
            type="number"
            min="1"
          >
        </div>

        <div class="form-item">
          <label for="maxLength">最大长度：</label>
          <input
            id="maxLength"
            v-model="passwordRules.maxLength"
            type="number"
            min="1"
          >
        </div>

        <div class="form-item">
          <label for="minDigits">最少数字个数：</label>
          <input
            id="minDigits"
            v-model="passwordRules.minDigits"
            type="number"
            min="0"
          >
        </div>

        <div class="form-item">
          <label for="minSpecialChars">最少特殊字符个数：</label>
          <input
            id="minSpecialChars"
            v-model="passwordRules.minSpecialChars"
            type="number"
            min="0"
          >
        </div>

        <div class="form-item">
          <label for="minUpperCaseLetters">最少大写字母个数：</label>
          <input
            id="minUpperCaseLetters"
            v-model="passwordRules.minUpperCaseLetters"
            type="number"
            min="0"
          >
        </div>

        <div class="form-item">
          <label for="minLowerCaseLetters">最少小写字母个数：</label>
          <input
            id="minLowerCaseLetters"
            v-model="passwordRules.minLowerCaseLetters"
            type="number"
            min="0"
          >
        </div>
      </div>

      <button class="save-button" @click="saveSettings">
        保存设置
      </button>
    </div>

    <!-- <div class="setting-section">
      <h2 class="text-lg font-bold mb-4">
        服务器设置
      </h2>

      <div class="setting-item mb-3">
        <label for="server-url">API服务器地址</label>
        <input
          id="server-url"
          v-model="appConfig.serverUrl"
          type="url"
          placeholder="https://api.example.com"
          class="w-full p-2 border rounded"
        >
      </div>

      <div class="setting-item mb-3">
        <label for="login-url">登录页面地址</label>
        <input
          id="login-url"
          v-model="appConfig.loginUrl"
          type="url"
          placeholder="https://example.com/login"
          class="w-full p-2 border rounded"
        >
      </div>

      <div class="setting-item mb-3">
        <label for="manager-url">密码管理页面地址</label>
        <input
          id="manager-url"
          v-model="appConfig.passwordManagerUrl"
          type="url"
          placeholder="https://example.com/password-manager"
          class="w-full p-2 border rounded"
        >
      </div>

      <div class="setting-item">
        <label for="app-name">应用名称</label>
        <input
          id="app-name"
          v-model="appConfig.appName"
          type="text"
          placeholder="密码安全助手"
          class="w-full p-2 border rounded"
        >
      </div>
    </div>
    <div class="mt-4">
      <button class="save-button" @click="saveAllSettings">
        保存所有设置
      </button>
    </div> -->
  </main>
</template>

<style scoped>
.message {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 1000;
  animation: slideDown 0.3s ease-in-out;
}

.success {
  background-color: #67C23A;
  color: white;
}

.error {
  background-color: #F56C6C;
  color: white;
}

@keyframes slideDown {
  from {
    transform: translate(-50%, -20px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.logo {
  width: 40px;
  height: 40px;
  margin-right: 15px;
}

h1 {
  margin: 0;
  color: #2c3e50;
}

.settings-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #eee;
}

.settings-group {
  display: grid;
  gap: 15px;
}

.form-item {
  display: grid;
  grid-template-columns: 200px 1fr;
  align-items: center;
  gap: 10px;
}

label {
  color: #606266;
  font-size: 14px;
}

input[type="number"] {
  width: 100%;
  max-width: 200px;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

input[type="number"]:focus {
  outline: none;
  border-color: #409eff;
}

.save-button {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.save-button:hover {
  background-color: #66b1ff;
}

.save-button:active {
  background-color: #3a8ee6;
}
</style>
