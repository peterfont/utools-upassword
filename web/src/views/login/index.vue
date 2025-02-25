<template>
  <div class="login-container">
    <h1 class="page-title">密码风险检测与保护</h1>

    <!-- 修改动画背景 -->
    <div class="animated-background">
      <div class="network-grid"></div>
      <div class="network-balls">
        <div class="ball"></div>
        <div class="ball"></div>
        <div class="ball"></div>
        <div class="ball"></div>
        <div class="ball"></div>
      </div>
    </div>

    <el-card class="login-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" :rules="rules" ref="loginFormRef">
            <el-form-item prop="username">
              <el-input v-model="loginForm.username" placeholder="用户名" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="密码" />
            </el-form-item>
            <el-button type="primary" @click="handleLogin" :loading="loading">登录</el-button>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <el-form :model="registerForm" :rules="rules" ref="registerFormRef">
            <el-form-item prop="username">
              <el-input v-model="registerForm.username" placeholder="用户名" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="registerForm.password" type="password" placeholder="密码" />
            </el-form-item>
            <el-button type="primary" @click="handleRegister" :loading="loading">注册</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { login, register } from '@/api/user'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const activeTab = ref('login')
const loading = ref(false)
const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: ''
})
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    
    loading.value = true
    const response = await login(loginForm)
    const token = response.data
    localStorage.setItem('token', token)

    // 通知插件登录成功
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ 
        type: 'LOGIN_SUCCESS',
        data: {
          token: token,
          userInfo: {
            username: loginForm.username
          }
        }
      });
    }

    router.push('/')
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    // 校验表单
    await registerFormRef.value.validate()
    
    loading.value = true
    await register(registerForm)
    activeTab.value = 'login'
    ElMessage.success('注册成功')
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  position: relative;
  overflow: hidden;
}

/* 网络背景动画 */
.animated-background {
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  z-index: 1;
  background: radial-gradient(circle at center, #f5f5f5 0%, #e6e6e6 100%);
}

.network-grid {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(to right, rgba(24,144,255,0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(24,144,255,0.1) 1px, transparent 1px);
  background-size: 50px 50px;
}

.network-balls {
  position: absolute;
  width: 100%;
  height: 100%;
}

.ball {
  position: absolute;
  width: 6px;
  height: 6px;
  background: #1890ff;
  border-radius: 50%;
  filter: blur(1px);
}

.ball:nth-child(1) {
  top: 20%;
  left: 20%;
  animation: floating 8s infinite;
}

.ball:nth-child(2) {
  top: 60%;
  left: 80%;
  animation: floating 12s infinite;
}

.ball:nth-child(3) {
  top: 80%;
  left: 15%;
  animation: floating 10s infinite;
}

.ball:nth-child(4) {
  top: 30%;
  left: 70%;
  animation: floating 9s infinite;
}

.ball:nth-child(5) {
  top: 50%;
  left: 50%;
  animation: floating 11s infinite;
}

@keyframes floating {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0.5;
  }
  25% {
    transform: translate(50px, 25px) scale(1.5);
    opacity: 0.8;
  }
  50% {
    transform: translate(100px, 0) scale(1);
    opacity: 0.5;
  }
  75% {
    transform: translate(50px, -25px) scale(1.5);
    opacity: 0.8;
  }
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.5;
  }
}

/* 原有卡片和标题样式保持不变 */
.page-title {
  font-size: 24px;
  color: #1a1a1a;
  margin-bottom: 40px;
  text-align: center;
  position: relative;
  z-index: 2;
}

.login-card {
  width: 400px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 2;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-tabs__header) {
  margin-bottom: 24px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-button) {
  width: 100%;
  margin-top: 10px;
}

:deep(.el-tabs__nav) {
  width: 100%;
  display: flex;
}

:deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
}
</style>