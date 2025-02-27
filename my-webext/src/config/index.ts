// src/config/index.ts
import browser from 'webextension-polyfill'

// 配置类型定义
export interface AppConfig {
  // 服务器相关
  serverUrl: string
  loginUrl: string
  passwordManagerUrl: string

  // 应用基本信息
  appName: string
  appVersion: string

  // 功能配置
  enableAutoSync: boolean
  enableNotifications: boolean

  // 其他配置项...
}

// 默认配置
export const defaultConfig: AppConfig = {
  serverUrl: 'https://api.password-manager.example.com',
  loginUrl: 'https://account.password-manager.example.com/login',
  passwordManagerUrl: 'https://account.password-manager.example.com/manager',

  appName: '密码安全助手',
  appVersion: '1.0.0',

  enableAutoSync: false,
  enableNotifications: true,
}

// 加载配置，合并默认值和存储值
export async function loadConfig(): Promise<AppConfig> {
  try {
    const result = await browser.storage.sync.get('appConfig')
    if (result.appConfig) {
      // 合并配置，确保新增配置项也有默认值
      return {
        ...defaultConfig,
        ...result.appConfig,
      }
    }
    return defaultConfig
  }
  catch (error) {
    console.error('加载配置失败:', error)
    return defaultConfig
  }
}

// 保存配置
export async function saveConfig(config: Partial<AppConfig>): Promise<void> {
  try {
    // 首先获取现有配置
    const current = await loadConfig()

    // 合并新配置
    const newConfig = {
      ...current,
      ...config,
    }

    // 保存到同步存储
    await browser.storage.sync.set({ appConfig: newConfig })
  }
  catch (error) {
    console.error('保存配置失败:', error)
    throw error
  }
}
