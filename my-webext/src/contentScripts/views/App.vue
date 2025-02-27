<script setup lang="ts">
import { useToggle } from '@vueuse/core'
import { ref, onMounted, computed } from 'vue'
import browser from 'webextension-polyfill'
import 'uno.css'

const [show, toggle] = useToggle(false)
const generatedPassword = ref('')
const passwordRules = ref({
  length: 12,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeSimilar: false
})
const copySuccess = ref(false)
const isPasswordVisible = ref(false)

// 从存储中获取密码规则
async function loadPasswordRules() {
  try {
    const result = await browser.storage.sync.get('passwordRules')
    if (result.passwordRules) {
      passwordRules.value = {
        ...passwordRules.value,
        ...result.passwordRules
      }
      console.log('已加载密码规则:', passwordRules.value)
    }
  } catch (error) {
    console.error('加载密码规则失败:', error)
  }
}

// 生成随机密码
function generatePassword() {
  const rules = passwordRules.value
  const length = rules.length || 12
  
  // 定义字符集
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz'
  const numberChars = '0123456789'
  const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  // 排除相似字符
  const similarChars = 'il1Lo0O'
  
  let availableChars = ''
  
  if (rules.uppercase) 
    availableChars += rules.excludeSimilar 
      ? uppercaseChars.replace(/[il1Lo0O]/g, '') 
      : uppercaseChars
  
  if (rules.lowercase) 
    availableChars += rules.excludeSimilar 
      ? lowercaseChars.replace(/[il1Lo0O]/g, '') 
      : lowercaseChars
  
  if (rules.numbers) 
    availableChars += rules.excludeSimilar 
      ? numberChars.replace(/[10]/g, '') 
      : numberChars
  
  if (rules.symbols) 
    availableChars += symbolChars
  
  // 如果没有选择任何规则，默认使用小写字母
  if (!availableChars) 
    availableChars = lowercaseChars
  
  // 生成密码
  let password = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * availableChars.length)
    password += availableChars[randomIndex]
  }
  
  // 确保密码符合所有选中的规则
  let meetsRequirements = true
  
  if (rules.uppercase && !/[A-Z]/.test(password)) 
    meetsRequirements = false
  
  if (rules.lowercase && !/[a-z]/.test(password)) 
    meetsRequirements = false
  
  if (rules.numbers && !/[0-9]/.test(password)) 
    meetsRequirements = false
  
  if (rules.symbols && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) 
    meetsRequirements = false
  
  // 如果不符合规则，重新生成
  if (!meetsRequirements) 
    return generatePassword()
  
  generatedPassword.value = password
  return password
}

// 复制密码到剪贴板
async function copyPassword() {
  try {
    await navigator.clipboard.writeText(generatedPassword.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 切换密码可见性
function togglePasswordVisibility() {
  isPasswordVisible.value = !isPasswordVisible.value
}

// 组件初始化
onMounted(async () => {
  await loadPasswordRules()
  generatePassword()
})

// 密码强度计算
const passwordStrength = computed(() => {
  const password = generatedPassword.value
  if (!password) return 0
  
  // 计算密码强度
  let strength = 0
  
  // 长度分数
  strength += Math.min(password.length, 12) / 3
  
  // 包含大写字母
  if (/[A-Z]/.test(password)) strength += 1
  
  // 包含小写字母
  if (/[a-z]/.test(password)) strength += 1
  
  // 包含数字
  if (/[0-9]/.test(password)) strength += 1
  
  // 包含特殊字符
  if (/[^A-Za-z0-9]/.test(password)) strength += 1
  
  return Math.min(strength, 5)
})

// 密码强度颜色
const strengthColor = computed(() => {
  const strength = passwordStrength.value
  if (strength < 2) return 'bg-red-500'
  if (strength < 3) return 'bg-orange-500'
  if (strength < 4) return 'bg-yellow-500'
  return 'bg-green-500'
})
</script>

<template>
  <div class="fixed right-0 bottom-0 m-5 z-100 flex items-end font-sans select-none leading-1em">
    <div
      v-show="show"
      class="bg-white text-gray-800 rounded-lg shadow w-max h-min"
      p="x-4 y-4"
      m="y-auto r-2"
      transition="opacity duration-300"
      :class="show ? 'opacity-100' : 'opacity-0'"
    >
      <h1 class="text-lg font-bold mb-3">
        密码安全助手
      </h1>
      
      <!-- 密码生成区域 -->
      <div class="mb-4">
        <div class="text-sm mb-2 font-medium">生成安全密码</div>
        
        <div class="flex items-center mb-2 bg-gray-100 rounded p-2">
          <div class="relative flex-grow">
            <input
              :type="isPasswordVisible ? 'text' : 'password'"
              v-model="generatedPassword"
              class="w-full bg-transparent border-none outline-none pr-8"
              readonly
            />
            <button
              class="absolute right-0 top-0 text-gray-500 hover:text-gray-700 p-1"
              @click="togglePasswordVisibility"
              title="显示/隐藏密码"
            >
              <svg v-if="isPasswordVisible" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          
          <button
            class="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
            @click="generatePassword"
            title="生成新密码"
          >
            刷新
          </button>
          
          <button
            class="ml-2 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm flex items-center"
            @click="copyPassword"
            title="复制密码"
          >
            <span v-if="copySuccess">已复制!</span>
            <span v-else>复制</span>
          </button>
        </div>
        
        <!-- 密码强度指示器 -->
        <div class="w-full h-1.5 bg-gray-200 rounded overflow-hidden">
          <div
            class="h-full transition-all duration-300"
            :class="strengthColor"
            :style="`width: ${(passwordStrength / 5) * 100}%`"
          ></div>
        </div>
        <div class="text-xs text-gray-500 mt-1">
          密码强度: {{ ['非常弱', '弱', '一般', '强', '非常强'][Math.floor(passwordStrength)] }}
        </div>
      </div>
      
      <div class="text-sm text-gray-500">密码保护中...</div>
    </div>
    <button
      class="flex w-10 h-10 rounded-full shadow cursor-pointer border-none"
      bg="teal-600 hover:teal-700"
      @click="toggle()"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="block m-auto text-white text-lg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a10 10 0 0 0-9.95 9h11.64L9.74 7.05a1 1 0 0 1 1.41-1.41l5.66 5.65a1 1 0 0 1 0 1.42l-5.66 5.65a1 1 0 0 1-1.41-1.41L13.69 13H2.05A10 10 0 1 0 12 2z"></path>
      </svg>
    </button>
  </div>
</template>
