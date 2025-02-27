// src/contentScripts/autofill.ts
import browser from 'webextension-polyfill'
import { onMessage } from 'webext-bridge/content-script'

interface LoginRecord {
  id?: number
  url: string
  username: string
  password: string
  notes?: string
  timestamp?: number
}

// 检测页面中的登录表单
function detectLoginForms() {
  // 查找密码输入框
  const passwordInputs = Array.from(document.querySelectorAll('input[type="password"]'))
  
  if (passwordInputs.length === 0) return []
  
  return passwordInputs.map(passwordInput => {
    // 对于每个密码输入框，尝试找到相关的用户名输入框
    const form = passwordInput.closest('form')
    let usernameInput: HTMLInputElement | null = null
    
    if (form) {
      // 在同一表单中寻找可能的用户名输入框
      const inputs = Array.from(form.querySelectorAll('input[type="text"], input[type="email"], input:not([type])'))
      usernameInput = inputs.find(input => {
        const inputName = input.name?.toLowerCase() || ''
        const inputId = input.id?.toLowerCase() || ''
        const placeholder = input.placeholder?.toLowerCase() || ''
        
        return inputName.includes('user') || inputName.includes('email') || 
               inputId.includes('user') || inputId.includes('email') ||
               placeholder.includes('user') || placeholder.includes('email') ||
               inputName.includes('login') || inputId.includes('login')
      }) as HTMLInputElement || null
    } else {
      // 如果密码框不在表单内，尝试在页面中找到临近的用户名输入框
      const allInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input:not([type])'))
      usernameInput = allInputs.find(input => {
        const rect1 = input.getBoundingClientRect()
        const rect2 = passwordInput.getBoundingClientRect()
        
        // 认为在垂直方向靠近且左侧水平对齐的输入框可能是用户名
        return Math.abs(rect1.top - rect2.top) < 150 && 
               Math.abs(rect1.left - rect2.left) < 50
      }) as HTMLInputElement || null
    }
    
    return {
      form: form,
      passwordInput: passwordInput as HTMLInputElement,
      usernameInput: usernameInput
    }
  })
}

// 查询与当前URL匹配的保存密码
async function findMatchingPasswords(): Promise<LoginRecord[]> {
  try {
    const hostname = new URL(window.location.href).hostname
    
    // 从本地存储获取所有保存的密码
    const result = await browser.storage.local.get('loginRecords')
    const loginRecords: LoginRecord[] = result.loginRecords || []
    
    // 筛选匹配当前网站的密码记录
    return loginRecords.filter(record => {
      try {
        const recordHostname = new URL(record.url).hostname
        return recordHostname === hostname
      } catch (e) {
        console.warn('Invalid URL in login record:', record.url)
        return false
      }
    })
  } catch (error) {
    console.error('查找匹配密码失败:', error)
    return []
  }
}

// 为输入框添加自动填充图标
function attachAutofillButtons(loginForms, matchingRecords: LoginRecord[]) {
  if (matchingRecords.length === 0 || loginForms.length === 0) return
  
  loginForms.forEach(form => {
    if (!form.usernameInput) return
    
    // 创建自动填充按钮
    const autofillButton = document.createElement('div')
    autofillButton.className = 'password-autofill-btn'
    autofillButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
        <path fill="#4285f4" d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H8.9V6zM18 20H6V10h12v10z"/>
      </svg>
    `
    autofillButton.style.cssText = `
      position: absolute;
      cursor: pointer;
      z-index: 9999;
      background: white;
      border-radius: 50%;
      padding: 3px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      transition: all 0.2s;
    `
    
    // 定位按钮
    const inputRect = form.usernameInput.getBoundingClientRect()
    autofillButton.style.top = `${window.scrollY + inputRect.top + inputRect.height/2 - 10}px`
    autofillButton.style.left = `${window.scrollX + inputRect.right - 25}px`
    
    // 单个记录时，点击直接填充
    if (matchingRecords.length === 1) {
      autofillButton.addEventListener('click', () => {
        fillCredentials(form, matchingRecords[0])
        autofillButton.style.backgroundColor = '#d6f5d6' // 填充后变绿
        setTimeout(() => {
          autofillButton.style.backgroundColor = 'white'
        }, 1000)
      })
    } 
    // 多个记录时，显示选择菜单
    else {
      autofillButton.addEventListener('click', (e) => {
        e.stopPropagation()
        showCredentialSelectionMenu(form, autofillButton, matchingRecords)
      })
    }
    
    document.body.appendChild(autofillButton)
    
    // 监听滚动事件，保持按钮跟随输入框
    window.addEventListener('scroll', () => {
      const newRect = form.usernameInput?.getBoundingClientRect()
      if (newRect) {
        autofillButton.style.top = `${window.scrollY + newRect.top + newRect.height/2 - 10}px`
        autofillButton.style.left = `${window.scrollX + newRect.right - 25}px`
      }
    })
  })
}

// 显示选择菜单
function showCredentialSelectionMenu(form, buttonEl, records: LoginRecord[]) {
  // 移除可能已存在的菜单
  document.querySelectorAll('.credentials-menu').forEach(el => el.remove())
  
  const menuEl = document.createElement('div')
  menuEl.className = 'credentials-menu'
  menuEl.style.cssText = `
    position: absolute;
    z-index: 10000;
    background: white;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    padding: 8px 0;
    min-width: 200px;
    max-height: 300px;
    overflow-y: auto;
  `
  
  // 添加标题
  const titleEl = document.createElement('div')
  titleEl.textContent = '选择要填充的账号:'
  titleEl.style.cssText = `
    padding: 5px 15px;
    color: #666;
    font-size: 12px;
    border-bottom: 1px solid #eee;
    margin-bottom: 5px;
  `
  menuEl.appendChild(titleEl)
  
  // 添加记录列表
  records.forEach(record => {
    const itemEl = document.createElement('div')
    itemEl.style.cssText = `
      padding: 8px 15px;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
    `
    
    const usernameEl = document.createElement('div')
    usernameEl.textContent = record.username
    usernameEl.style.fontWeight = 'bold'
    
    const urlEl = document.createElement('div')
    urlEl.textContent = new URL(record.url).hostname
    urlEl.style.cssText = `
      color: #999;
      font-size: 11px;
      margin-top: 3px;
    `
    
    const textContainer = document.createElement('div')
    textContainer.appendChild(usernameEl)
    textContainer.appendChild(urlEl)
    
    itemEl.appendChild(textContainer)
    
    itemEl.addEventListener('mouseover', () => {
      itemEl.style.backgroundColor = '#f5f5f5'
    })
    
    itemEl.addEventListener('mouseout', () => {
      itemEl.style.backgroundColor = 'transparent'
    })
    
    itemEl.addEventListener('click', () => {
      fillCredentials(form, record)
      menuEl.remove()
      buttonEl.style.backgroundColor = '#d6f5d6'
      setTimeout(() => {
        buttonEl.style.backgroundColor = 'white'
      }, 1000)
    })
    
    menuEl.appendChild(itemEl)
  })
  
  // 点击外部关闭菜单
  const closeMenu = (e) => {
    if (!menuEl.contains(e.target) && !buttonEl.contains(e.target)) {
      menuEl.remove()
      document.removeEventListener('click', closeMenu)
    }
  }
  document.addEventListener('click', closeMenu)
  
  // 定位菜单
  const buttonRect = buttonEl.getBoundingClientRect()
  menuEl.style.top = `${window.scrollY + buttonRect.bottom + 5}px`
  menuEl.style.left = `${window.scrollX + buttonRect.left - 180}px`
  
  document.body.appendChild(menuEl)
}

// 填充用户名和密码
function fillCredentials(form, record: LoginRecord) {
  if (form.usernameInput) {
    form.usernameInput.value = record.username
    
    // 触发输入事件，以便激活可能的前端验证
    const inputEvent = new Event('input', { bubbles: true })
    const changeEvent = new Event('change', { bubbles: true })
    form.usernameInput.dispatchEvent(inputEvent)
    form.usernameInput.dispatchEvent(changeEvent)
  }
  
  if (form.passwordInput) {
    form.passwordInput.value = record.password
    
    // 触发输入事件
    const inputEvent = new Event('input', { bubbles: true })
    const changeEvent = new Event('change', { bubbles: true })
    form.passwordInput.dispatchEvent(inputEvent)
    form.passwordInput.dispatchEvent(changeEvent)
  }
}

// 主函数，初始化自动填充功能
export async function initAutofill() {
  // 检查是否是登录页面
  const loginForms = detectLoginForms()
  if (loginForms.length === 0) return
  
  // 查找匹配的保存密码
  const matchingRecords = await findMatchingPasswords()
  if (matchingRecords.length === 0) return
  
  // 添加自动填充按钮
  setTimeout(() => {
    attachAutofillButtons(loginForms, matchingRecords)
  }, 500)
  
  // 处理来自后台的消息，如果有更新的记录需要刷新
  onMessage('password-updated', () => {
    // 重新加载匹配记录并更新UI
    document.querySelectorAll('.password-autofill-btn, .credentials-menu').forEach(el => el.remove())
    initAutofill()
  })
}

// 初始化自动填充功能的样式
export function initAutofillStyles() {
  const style = document.createElement('style')
  style.textContent = `
    .password-autofill-btn {
      opacity: 0.8;
    }
    .password-autofill-btn:hover {
      opacity: 1;
      transform: scale(1.1);
    }
  `
  document.head.appendChild(style)
}