<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <el-menu
        default-active="/account"
        class="menu"
        router
      >
        <el-menu-item index="/account">
          <el-icon><Document /></el-icon>
          <span>账户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { Document, ArrowDown } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { logout } from '@/api/user'

const router = useRouter()

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await logout()
      localStorage.removeItem('token')
      ElMessage.success('退出登录成功')
      router.push('/login')
    } catch (error) {
      ElMessage.error('退出登录失败')
    }
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.menu {
  height: 100%;
  border-right: solid 1px #e6e6e6;
}

.header-right {
  float: right;
  cursor: pointer;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
}
</style>