import { onMessage, sendMessage } from 'webext-bridge/background'
import type { Tabs } from 'webextension-polyfill'
import browser from 'webextension-polyfill'
import { checkPassword, getDefaultPasswordRules, getPasswordRules } from '~/utils/passwordChecker'
import { notifyRecordsUpdate, sendInsecurePasswordNotification } from '~/utils/notificationManager'

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

// remove or turn this off if you don't use side panel
const USE_SIDE_PANEL = false

// to toggle the sidepanel with the action button in chromium:
if (USE_SIDE_PANEL) {
  // @ts-expect-error missing types
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: unknown) => console.error(error))
}

browser.runtime.onInstalled.addListener((): void => {
  // eslint-disable-next-line no-console
  console.log('Extension installed')
})

let previousTabId = 0

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!previousTabId) {
    previousTabId = tabId
    return
  }

  let tab: Tabs.Tab

  try {
    tab = await browser.tabs.get(previousTabId)
    previousTabId = tabId
  }
  catch {
    return
  }

  // eslint-disable-next-line no-console
  console.log('previous tab', tab)
  sendMessage('tab-prev', { title: tab.title }, { context: 'content-script', tabId })
})

onMessage('get-current-tab', async () => {
  try {
    const tab = await browser.tabs.get(previousTabId)
    return {
      title: tab?.title,
    }
  }
  catch {
    return {
      title: undefined,
    }
  }
})

// =====业务代码======

/**
 * 密码记录注入和管理模块
 * 负责监听登录信息、处理导航事件并保存密码记录
 */

// 登录信息类型定义
interface LoginInfo {
  username: string
  password: string
  url: string
  timestamp: number
}

// 密码记录类型定义
interface PasswordRecord extends LoginInfo {
  timestamp: number
}

/**
 * 临时缓存的登录信息
 */
let pendingLoginInfo: LoginInfo | null = null

/**
 * 监听来自 content-script 的消息
 * 处理登录信息缓存请求
 */
onMessage('CACHE_LOGIN_INFO', ({ data }) => {
  pendingLoginInfo = data
  return { status: 'success' }
})

/**
 * 监听页面导航完成事件
 * 用于检测登录成功后的页面跳转
 */
browser.webNavigation.onCompleted.addListener((details) => {
  if (!pendingLoginInfo) {
    return
  }

  try {
    // 检查是否是登录成功后的跳转
    const loginUrl = new URL(pendingLoginInfo.url)
    const currentUrl = new URL(details.url)

    // 验证判断条件:
    // 1. 同源网站
    // 2. 主框架导航
    // 3. 时间在5秒之内
    if (
      loginUrl.origin === currentUrl.origin
      && details.frameId === 0
      && Date.now() - pendingLoginInfo.timestamp < 5000
    ) {
      saveLoginInfo(pendingLoginInfo)
    }
  }
  catch {
    // URL 解析错误处理
  }
})

/**
 * 保存登录信息到本地存储
 *
 * @param loginInfo - 要保存的登录信息
 */
async function saveLoginInfo(loginInfo: LoginInfo): Promise<void> {
  try {
    // 检查密码是否符合规则
    const checkResult = await checkPassword(loginInfo.password)

    // 获取现有记录
    const result = await browser.storage.local.get('loginRecords')
    const records: PasswordRecord[] = result.loginRecords || []

    // 更新或添加记录
    const newRecord: PasswordRecord = {
      ...loginInfo,
      timestamp: Date.now(),
    }

    // 如果密码不合法，发送通知
    if (!checkResult.valid) {
      console.warn('检测到不安全的密码:', checkResult.reason)
      await sendInsecurePasswordNotification(
        loginInfo.url,
        loginInfo.username,
        checkResult.reason,
      )
    }

    // 检查是否存在相同网站的记录
    const sameUrlIndex = records.findIndex(
      (record) => {
        try {
          return new URL(record.url).origin === new URL(loginInfo.url).origin
        }
        catch {
          return false
        }
      },
    )

    if (sameUrlIndex !== -1) {
      // 更新现有记录
      records[sameUrlIndex] = newRecord
    }
    else {
      // 添加新记录
      records.push(newRecord)
    }

    // 保存到本地存储
    await browser.storage.local.set({ loginRecords: records })

    // 清除临时缓存
    pendingLoginInfo = null

    // 通知 popup 更新显示，仅在确认 popup 存在时发送
    browser.extension.getViews({ type: 'popup' }).length > 0 && notifyRecordsUpdate(records.length)
  }
  catch (error) {
    // 错误处理
    console.error('保存登录信息失败:', error)
    pendingLoginInfo = null
  }
}

// 处理保存密码规则
onMessage('save-password-rules', async ({ data }) => {
  try {
    await browser.storage.sync.set({ passwordRules: data.passwordRules })
    return { success: true }
  }
  catch (error) {
    console.error('保存密码规则失败:', error)
    return { success: false, error: String(error) }
  }
})

// 处理获取密码规则
onMessage('get-password-rules', async () => {
  try {
    const rules = await getPasswordRules()
    return { passwordRules: rules }
  }
  catch (error) {
    console.error('获取密码规则失败:', error)
    return {
      passwordRules: getDefaultPasswordRules(),
      error: String(error),
    }
  }
})

// 检查通知权限
async function checkNotificationPermission() {
  try {
    // 在某些浏览器中，这会检查通知权限
    const permissionStatus = await browser.permissions.contains({ permissions: ['notifications'] })
    console.log('通知权限状态:', permissionStatus)

    if (!permissionStatus) {
      console.warn('没有通知权限，尝试请求...')
      await browser.permissions.request({ permissions: ['notifications'] })
    }
  }
  catch (error) {
    console.error('检查通知权限失败:', error)
  }
}

// 在初始化时调用
checkNotificationPermission()
