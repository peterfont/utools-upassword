// 存储状态
let pendingLoginInfo = null;

// 监听来自 content-script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CACHE_LOGIN_INFO') {
    // 缓存登录信息以待验证
    pendingLoginInfo = message.data;
    sendResponse({ status: 'success' });
  }
  return true;
});

// 监听页面导航完成事件
chrome.webNavigation.onCompleted.addListener((details) => {
  if (!pendingLoginInfo) return;

  // 获取登录页面和当前页面的URL
  const loginUrl = new URL(pendingLoginInfo.url);
  const currentUrl = new URL(details.url);
  
  // 验证是否是登录成功后的跳转:
  // 1. 同源
  // 2. 主frame
  // 3. 5秒内的跳转
  if (loginUrl.origin === currentUrl.origin && 
      details.frameId === 0 && 
      Date.now() - pendingLoginInfo.timestamp < 5000) {
    saveLoginInfo(pendingLoginInfo);
  }
});

/**
 * 保存登录信息到本地存储
 * @param {Object} loginInfo - 登录信息对象
 * @param {string} loginInfo.url - 登录页面URL
 * @param {string} loginInfo.username - 用户名
 * @param {string} loginInfo.password - 密码 
 */
async function saveLoginInfo(loginInfo) {
  try {
    const result = await chrome.storage.local.get('loginRecords');
    const records = result.loginRecords || [];

    console.log('saveLoginInfo', loginInfo);
    
    // 检查是否存在相同网站的记录
    const sameUrlIndex = records.findIndex(record => 
      new URL(record.url).origin === new URL(loginInfo.url).origin
    );

    // 更新或添加记录
    if (sameUrlIndex !== -1) {
      records[sameUrlIndex] = {
        ...loginInfo
      };
    } else {
      records.push({
        ...loginInfo
      });
    }

    // 保存到storage
    await chrome.storage.local.set({ loginRecords: records });
    
    // 清除临时缓存
    pendingLoginInfo = null;
    
    // 通知popup更新
    chrome.runtime.sendMessage({
      type: 'UPDATE_RECORDS',
      data: { recordCount: records.length }
    });
  } catch (error) {
    pendingLoginInfo = null;
  }
}