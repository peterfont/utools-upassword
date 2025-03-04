/**
 * 密码管理插件注入脚本
 * 该脚本负责监听登录表单,捕获和处理登录信息
 */

import { sendMessage } from 'webext-bridge/content-script'
import { initAutofill, initAutofillStyles } from './autofill'

// 登录信息类型定义
interface LoginInfo {
  username: string
  password: string
  url: string
  timestamp: number
}

// 表单元素查找结果类型定义
interface FormElements {
  password: HTMLInputElement | null
  username: HTMLInputElement | null
}

// 缓存的登录信息
let cachedLoginInfo: LoginInfo | null = null
let isInitialized: boolean = false

/**
 * 初始化函数 - 设置插件监听和恢复状态
 */
export async function init(): Promise<void> {
  if (isInitialized) {
    return
  }

  console.log('内容脚本初始化')
  
  // 初始化自动填充功能
  initAutofillStyles()
  initAutofill()
  
  // 监听DOM变化，可能的动态登录表单
  const observer = new MutationObserver((mutations) => {
    // 检查是否新增了密码输入框
    const passwordInputAdded = mutations.some(mutation => 
      Array.from(mutation.addedNodes).some(node => 
        node instanceof HTMLElement && (
          node.querySelector('input[type="password"]') || 
          node.tagName === 'INPUT' && node.getAttribute('type') === 'password'
        )
      )
    )
    
    if (passwordInputAdded) {
      // 如果有新的密码框，重新初始化自动填充
      initAutofill()
    }
  })
  
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  })
  
  // 监听URL变化，SPA应用可能不会刷新页面
  let lastUrl = location.href
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href
      initAutofill()
    }
  })
  
  urlObserver.observe(document.querySelector('head'), {
    childList: true,
    subtree: true
  })

  // 从storage恢复状态
  try {
    const result = await new Promise<{ tempLoginInfo?: LoginInfo }>(
      (resolve) => {
        chrome.storage.local.get('tempLoginInfo', resolve)
      },
    )

    if (result.tempLoginInfo) {
      cachedLoginInfo = result.tempLoginInfo
      // 清除临时存储
      chrome.storage.local.remove('tempLoginInfo')
      // 检查登录状态
      setTimeout(checkLoginSuccess, 1000)
    }
  }
  catch {
    // 错误处理
  }

  watchAutofill()
  watchLoginAttempts()

  isInitialized = true
}

/**
 * 通用选择器定义 - 用于查找用户名和密码输入框
 */
const selectors = {
  password: [
    'input[type="password"]',
    'input[name*="pass"]',
    'input[id*="pass"]',
    '[aria-label*="密码"]',
    '[placeholder*="密码"]',
  ],
  username: [
    'input[type="text"]',
    'input[type="email"]',
    'input[name*="user"]',
    'input[name*="email"]',
    '[aria-label*="用户"]',
    '[aria-label*="账号"]',
  ],
}

/**
 * 递归查找包括 Shadow DOM 在内的所有匹配元素
 * @param root 要搜索的根元素
 * @param selector CSS选择器
 * @returns 匹配的元素数组
 */
function deepQuerySelector(
  root: Element | ShadowRoot,
  selector: string,
): Element[] {
  const elements = Array.from(root.querySelectorAll(selector))

  const shadows = Array.from(root.querySelectorAll('*'))
    .filter(el => el.shadowRoot)
    .map(el => deepQuerySelector(el.shadowRoot as ShadowRoot, selector))
    .flat()

  return [...elements, ...shadows]
}

/**
 * 查找表单元素,包括用户名和密码输入框
 * @returns 找到的表单元素对象
 */
function findFormElements(): FormElements {
  const results: FormElements = {
    password: null,
    username: null,
  }

  for (const [type, selectorList] of Object.entries(selectors)) {
    for (const selector of selectorList) {
      const elements = deepQuerySelector(document.documentElement, selector)

      for (const element of elements) {
        if ((element as HTMLInputElement).value) {
          results[type as keyof FormElements] = element as HTMLInputElement
          break
        }
      }
      if (results[type as keyof FormElements])
        break
    }
  }

  return results
}

/**
 * 监听输入框自动填充事件
 */
function watchAutofill(): void {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === 'attributes'
        && mutation.attributeName === 'value'
      ) {
        const elements = findFormElements()
        if (elements.password && elements.password.value) {
          cacheLoginInfo(elements)
        }
      }
    })
  })

  // 观察所有密码输入框的值变化
  selectors.password.forEach((selector) => {
    deepQuerySelector(document.documentElement, selector).forEach((element) => {
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['value'],
      })
    })
  })
}

/**
 * 缓存登录信息
 * @param elements 找到的表单元素
 */
function cacheLoginInfo(elements: FormElements): void {
  if (!elements.password || !elements.password.value)
    return

  cachedLoginInfo = {
    username: elements.username ? elements.username.value : '',
    password: elements.password.value,
    url: window.location.href,
    timestamp: Date.now(),
  }

  // 保存到storage
  chrome.storage.local.set({
    tempLoginInfo: cachedLoginInfo,
  })
}

/**
 * 监听所有可能的登录行为
 */
function watchLoginAttempts(): void {
  // 监听表单提交
  document.addEventListener('submit', handleLoginAttempt, true)

  // 监听按钮点击
  document.addEventListener(
    'click',
    (e) => {
      const loginButtons = [
        ...document.querySelectorAll(
          'button, input[type="button"], input[type="submit"], a',
        ),
      ].filter((el) => {
        const text = (
          (el as HTMLElement).textContent
          || (el as HTMLInputElement).value
          || ''
        ).toLowerCase()
        const attr = (
          (el as HTMLElement).getAttribute('aria-label') || ''
        ).toLowerCase()
        return (
          text.includes('登录')
          || text.includes('login')
          || attr.includes('登录')
          || attr.includes('login')
          || (el as HTMLInputElement).type === 'submit'
        )
      })

      if (loginButtons.includes(e.target as Element)) {
        handleLoginAttempt(e)
      }
    },
    true,
  )

  // 监听键盘事件（回车键）
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Enter') {
        const activeElement = document.activeElement
        if (
          activeElement
          && (activeElement.tagName === 'INPUT'
          || activeElement.tagName === 'BUTTON')
        ) {
          handleLoginAttempt(e)
        }
      }
    },
    true,
  )

  // 监听网络请求
  const originalFetch = window.fetch
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args)

    // 检查是否是登录请求
    if (
      typeof url === 'string'
      && (url.includes('login') || url.includes('auth') || url.includes('signin'))
    ) {
      handleLoginAttempt()
    }

    return response
  }

  // 监听表单输入完成
  function watchFormInputs(): void {
    const passwordInput = findFormElements().password
    if (passwordInput) {
      passwordInput.addEventListener('blur', function () {
        if (this.value) {
          const form = this.closest('form')
          if (form) {
            const allInputsFilled = Array.from(
              form.querySelectorAll('input[required]'),
            ).every(input => (input as HTMLInputElement).value.length > 0)
            if (allInputsFilled) {
              handleLoginAttempt()
            }
          }
        }
      })
    }
  }

  watchFormInputs()
}

/**
 * 处理登录尝试 - 捕获表单数据并发送到后台
 * @param event 可选的触发事件
 */
async function handleLoginAttempt(_event?: Event): Promise<void> {
  const elements = findFormElements()
  if (!elements.password || !elements.password.value) {
    return
  }

  // 收集登录信息
  const loginInfo: LoginInfo = {
    username: elements.username ? elements.username.value : '',
    password: elements.password.value,
    url: window.location.href,
    timestamp: Date.now(),
  }

  // 使用 webext-bridge 发送到后台服务
  try {
    await sendMessage('CACHE_LOGIN_INFO', loginInfo, { context: 'background' })
  }
  catch {
    // 忽略错误
  }
}

/**
 * 检查用户是否已成功登录
 */
async function checkLoginSuccess(): Promise<void> {
  if (!cachedLoginInfo) {
    return
  }

  // 检查是否过期
  if (Date.now() - cachedLoginInfo.timestamp > 5 * 60 * 1000) {
    await clearLoginCache()
    return
  }

  // 检查登录状态
  const tokens = ['token', 'auth', 'session']
  const isLoggedIn = tokens.some(
    token =>
      document.cookie.includes(token)
      || localStorage.getItem(token)
      || sessionStorage.getItem(token),
  )

  if (isLoggedIn) {
    await notifyLoginSuccess()
  }
}

/**
 * 清除登录缓存
 */
async function clearLoginCache(): Promise<void> {
  cachedLoginInfo = null
  await new Promise<void>((resolve) => {
    chrome.storage.local.remove('tempLoginInfo', () => resolve())
  })
}

/**
 * 通知插件登录成功,保存记录
 */
async function notifyLoginSuccess(): Promise<void> {
  if (!cachedLoginInfo) {
    return
  }

  try {
    await new Promise<void>((resolve, reject) => {
      chrome.storage.local.get('loginRecords', (result) => {
        const records: LoginInfo[] = result.loginRecords || []

        // 创建新记录
        const newRecord: LoginInfo = {
          url: cachedLoginInfo!.url,
          username: cachedLoginInfo!.username,
          password: cachedLoginInfo!.password,
          timestamp: Date.now(),
        }

        const sameUrlIndex = records.findIndex(
          record =>
            new URL(record.url).origin === new URL(newRecord.url).origin,
        )

        if (sameUrlIndex !== -1) {
          records[sameUrlIndex] = newRecord
        }
        else {
          records.push(newRecord)
        }

        chrome.storage.local.set({ loginRecords: records }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          }
          else {
            resolve()
          }
        })
      })
    })

    // 使用 webext-bridge 发送成功消息
    await sendMessage('LOGIN_SUCCESS', { success: true }, { context: 'background' })
    // 清除缓存
    await clearLoginCache()
  }
  catch {
    // 忽略错误
  }
}
