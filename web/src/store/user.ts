import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface UserState {
  id: number;
  username: string;
  lastLoginAt?: Date;
  lastLoginIp?: string;
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserState | null>(null);
  const token = ref<string | null>(null);

  // 设置用户信息
  function setUserInfo(info: UserState) {
    userInfo.value = info;
  }

  // 设置token
  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  }

  // 清除用户信息
  function clearUserInfo() {
    userInfo.value = null;
    token.value = null;
    localStorage.removeItem('token');
  }

  // 初始化token
  function initToken() {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      token.value = savedToken;
    }
  }

  return {
    userInfo,
    token,
    setUserInfo,
    setToken,
    clearUserInfo,
    initToken
  };
});