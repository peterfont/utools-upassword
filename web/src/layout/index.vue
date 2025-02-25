<template>
  <el-container class="layout-container">
    <!-- 顶部标题栏 -->
    <el-header height="60px" class="main-header">
      <div class="header-container">
        <div class="menu-toggle" @click="toggleMenu">
          <el-icon><Fold v-if="!isCollapse"/><Expand v-else/></el-icon>
        </div>
        
        <!-- Logo 和 Slogan 容器 -->
        <div class="logo-slogan-container">
          <div class="logo-container">
            <h2>密码管理系统</h2>
          </div>
          <div class="slogan-container" v-show="!isMobile">
            <h1>基于Chrome插件的用户密码风险检测与保护</h1>
          </div>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand" @visible-change="handleDropdownVisibleChange">
            <span class="el-dropdown-link">
              <el-avatar 
                :size="32" 
                src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
              />
              <span class="username">{{ username }}</span>
              <el-icon class="dropdown-icon" :class="{ 'is-rotate': dropdownVisible }">
                <arrow-down />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <!-- <el-dropdown-item command="settings">设置</el-dropdown-item> -->
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </el-header>

    <!-- 主体内容区域 -->
    <el-container class="main-container">
      <!-- 侧边栏 -->
      <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
        <el-menu
          :default-active="activeMenu"
          class="menu"
          router
          :collapse="isCollapse"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/account">
            <el-icon><Document /></el-icon>
            <template #title>账户管理</template>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <!-- 内容区域 -->
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Document, ArrowDown, Fold, Expand } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { logout } from '@/api/user'

const router = useRouter()
const route = useRoute()
const username = ref(localStorage.getItem('username') || '用户')
const isCollapse = ref(false)
const isMobile = ref(false)

// 检查是否为移动设备
const checkIsMobile = () => {
  isMobile.value = window.innerWidth <= 768
  isCollapse.value = isMobile.value
}

// 监听窗口大小变化
onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile)
})

// 切换菜单展开/收起
const toggleMenu = () => {
  isCollapse.value = !isCollapse.value
}

// 计算当前激活的菜单项
const activeMenu = computed(() => route.path)

const handleCommand = async (command: string) => {
  switch (command) {
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      try {
        await logout()
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        ElMessage.success('退出登录成功')
        router.push('/login')
      } catch (error) {
        ElMessage.error('退出登录失败')
      }
      break
  }
}

// 添加下拉菜单状态控制
const dropdownVisible = ref(false)

// 处理下拉菜单显示状态变化
const handleDropdownVisibleChange = (visible: boolean) => {
  dropdownVisible.value = visible
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.main-header {
  background-color: #304156;
  padding: 0;
  height: 60px;
}

.header-container {
  height: 100%;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-slogan-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-container {
  padding-right: 20px;
  border-right: 1px solid rgba(255,255,255,0.1);
}

.logo-container h2 {
  margin: 0;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
}

.slogan-container h1 {
  margin: 0;
  color: #bfcbd9;
  font-size: 16px;
  font-weight: 400;
}

.main-container {
  height: calc(100vh - 60px);
}

.menu {
  height: 100%;
  border-right: none;
}

.header-right {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #fff;
}

.username {
  margin: 0 8px;
  color: #bfcbd9;
}

:deep(.el-menu-item) {
  &:hover {
    background-color: #263445 !important;
  }
}

.el-menu-item.is-active {
  background-color: #263445 !important;
}

.menu-toggle {
  font-size: 20px;
  color: #fff;
  cursor: pointer;
  margin-right: 20px;
  display: flex;
  align-items: center;
}

.sidebar {
  transition: width 0.3s;
  overflow: hidden;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .slogan-container {
    display: none;
  }
  
  .logo-container {
    padding-right: 10px;
  }
  
  .logo-container h2 {
    font-size: 16px;
  }
  
  .header-container {
    padding: 0 10px;
  }
  
  .el-aside {
    position: fixed;
    height: 100%;
    z-index: 1000;
    left: 0;
    top: 60px;
  }
  
  .el-main {
    margin-left: 64px;
  }
}

/* 菜单图标对齐 */
:deep(.el-menu--collapse) {
  .el-menu-item {
    text-align: center;
  }
  
  .el-icon {
    margin: 0;
  }
}

/* 优化菜单过渡动画 */
:deep(.el-menu) {
  transition: width 0.3s;
}

:deep(.el-menu-item) {
  transition: padding 0.3s;
}

/* 添加箭头动画相关样式 */
.dropdown-icon {
  transition: transform 0.3s ease;
  margin-left: 4px;
}

.dropdown-icon.is-rotate {
  transform: rotate(180deg);
}
</style>