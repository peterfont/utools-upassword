chrome.storage.onChanged.addListener((changes, namespace) => {
    if ('loginRecords' in changes) {
        console.log('登录记录发生变化:', changes.loginRecords.newValue);
    }
});

let pendingLoginInfo = null;

// 监听来自 content-script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CACHE_LOGIN_INFO') {
        pendingLoginInfo = message.data;
        console.log('[Service Worker] 已缓存登录信息:', {
            url: pendingLoginInfo.url,
            username: pendingLoginInfo.username
        });
        sendResponse({ status: 'success' });
    }
    return true;
});

// 监听页面导航
chrome.webNavigation.onCompleted.addListener((details) => {
    if (pendingLoginInfo) {
        console.log('[Service Worker] 检测到页面导航完成');
        
        // 检查是否是登录成功后的跳转
        const loginUrl = new URL(pendingLoginInfo.url);
        const currentUrl = new URL(details.url);
        
        if (loginUrl.origin === currentUrl.origin && 
            details.frameId === 0 && 
            Date.now() - pendingLoginInfo.timestamp < 5000) {
            
            console.log('[Service Worker] 符合登录成功条件，准备保存密码');
            saveLoginInfo(pendingLoginInfo);
        }
    }
});

// 保存登录信息
async function saveLoginInfo(loginInfo) {
    try {
        const result = await chrome.storage.local.get('loginRecords');
        const records = result.loginRecords || [];
        
        // 检查是否存在相同网站的记录
        const sameUrlIndex = records.findIndex(record => 
            new URL(record.url).origin === new URL(loginInfo.url).origin
        );

        if (sameUrlIndex !== -1) {
            console.log('[Service Worker] 更新现有记录');
            records[sameUrlIndex] = {
                ...loginInfo,
                timestamp: Date.now()
            };
        } else {
            console.log('[Service Worker] 添加新记录');
            records.push({
                ...loginInfo,
                timestamp: Date.now()
            });
        }

        await chrome.storage.local.set({ loginRecords: records });
        console.log('[Service Worker] 保存成功，总记录数:', records.length);
        
        // 清除缓存
        pendingLoginInfo = null;
        
        // 通知 popup 更新显示
        chrome.runtime.sendMessage({ 
            type: 'UPDATE_RECORDS',
            data: { recordCount: records.length }
        });
        
    } catch (error) {
        console.error('[Service Worker] 保存失败:', error);
    }
}