<template>
  <div class="header">
    <div class="logo">
      <h1>UPassword</h1>
    </div>
    <div class="user-info" v-if="userStore.userInfo">
      <span class="username">{{ userStore.userInfo.username }}</span>
      <el-dropdown>
        <span class="el-dropdown-link">
          <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';

const userStore = useUserStore();
const router = useRouter();

const handleLogout = () => {
  userStore.clearUserInfo();
  ElMessage.success('退出登录成功');
  router.push('/login');
};
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.logo h1 {
  margin: 0;
  font-size: 20px;
  color: #1890ff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-size: 14px;
  color: #666;
}

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
}
</style>