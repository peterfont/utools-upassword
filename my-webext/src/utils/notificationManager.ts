/* eslint-disable unused-imports/no-unused-vars */
// src/utils/notificationManager.ts
import browser from 'webextension-polyfill'
import { sendMessage } from 'webext-bridge/background'

/**
 * 发送不安全密码通知
 *
 * @param url 网站URL
 * @param username 用户名
 * @param reason 密码不安全原因
 */
export async function sendInsecurePasswordNotification(url: string, username: string, reason: string): Promise<void> {
  try {
    // 尝试不同的方式获取图标路径
    const iconUrl = browser.runtime.getURL('assets/icon-512.png')
      || browser.runtime.getURL('icon-512.png')
      || browser.runtime.getURL('icon.png')

    console.log('尝试创建通知，图标路径:', iconUrl)

    // 创建系统通知，添加更多选项以确保显示
    const notificationId = await browser.notifications.create(`password-insecure-${Date.now()}`, {
      type: 'basic',
      iconUrl,
      title: '密码安全风险',
      message: `网站: ${new URL(url).hostname}\n用户名: ${username}\n问题: ${reason}`,
      priority: 2,
      requireInteraction: true, // 要求用户交互才能消失
    })

    console.log('通知已创建，ID:', notificationId)

    // 添加通知点击处理
    browser.notifications.onClicked.addListener((clickedId) => {
      if (clickedId === notificationId) {
        // 点击通知时打开扩展的popup
        browser.action.openPopup()
      }
    })

    // 同样尝试发送消息到popup
    try {
      await sendMessage('PASSWORD_INSECURE', { url, username, reason }, { context: 'popup' })
    }
    catch (err) {
      console.debug('发送到popup失败，这是正常的', err)
    }
  }
  catch (error) {
    console.error('发送密码不安全通知失败:', error)

    // 备用方案：如果通知API失败，尝试使用alert
    try {
      setTimeout(() => {
        browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
          if (tabs[0]?.id) {
            browser.tabs.executeScript(tabs[0].id, {
              code: `alert("密码安全风险警告:\\n网站: ${new URL(url).hostname}\\n用户名: ${username}\\n问题: ${reason}")`,
            })
          }
        })
      }, 1000)
    }
    catch (e) {
      console.error('备用通知方案也失败了:', e)
    }
  }
}

/**
 * 通知前端记录已更新
 * 捕获可能出现的通信错误
 *
 * @param recordCount - 当前记录总数
 */
export function notifyRecordsUpdate(recordCount: number): void {
  // 使用 try-catch 包装消息发送
  try {
    // 使用 webext-bridge 发送消息
    sendMessage('UPDATE_RECORDS', { recordCount }, { context: 'popup' }).catch((error) => {
      // 捕获异步错误并忽略它
      // console.log('向popup发送更新通知失败，可能popup已关闭', error)
    })
  }
  catch (error) {
    // 捕获同步错误
    // console.log('向popup发送更新通知失败', error)
  }
}
