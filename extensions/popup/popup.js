// 用于存储登录记录的数组
let loginRecords = [];

// 监听来自 content-script 的登录成功消息
chrome.runtime.onMessage.addListener(async function(message) {
    if (message.type === 'LOGIN_SUCCESS') {
        const { username, password, url } = message.data;
        
        // 创建新的登录记录
        const newRecord = {
            url: url,
            username: username,
            password: password
        };

        // 获取并更新存储的记录
        chrome.storage.local.get('loginRecords', function(result) {
            let records = result.loginRecords || [];
            
            // 检查是否存在相同网站的记录
            const sameUrlIndex = records.findIndex(record => 
                new URL(record.url).origin === new URL(url).origin
            );

            // 更新或添加记录
            if (sameUrlIndex !== -1) {
                records[sameUrlIndex] = newRecord;
            } else {
                records.push(newRecord);
            }

            // 保存更新后的记录
            chrome.storage.local.set({ loginRecords: records }, function() {                
                // 更新显示
                displayRecords();
            });
        });
    }
});

/**
 * 删除指定索引的登录记录
 * @param {number} index - 要删除记录的索引
 */
function deleteRecord(index) {
    if (confirm('确定要删除这条记录吗?')) {
        chrome.storage.local.get('loginRecords', function (result) {
            let records = result.loginRecords || [];
            records.splice(index, 1);
            
            chrome.storage.local.set({ loginRecords: records }, function () {
                displayRecords();
            });
        });
    }
}

/**
 * 更新并显示所有登录记录
 */
async function updateAllRecords() {
    const result = await new Promise((resolve) => {
        chrome.storage.local.get('loginRecords', function (res) {
            resolve(res.loginRecords);
        });
    });
    loginRecords = result || [];
    displayRecords();
}

/**
 * 显示特定域名的密码记录
 * @param {Array} records - 密码记录数组
 */
function displayDomainPasswords(records) {
    const container = document.getElementById('domainPasswords');
    container.innerHTML = '';
    
    records.forEach((record, index) => {
        const item = document.createElement('div');
        item.className = 'password-item';
        item.innerHTML = `
            <div>用户名：${record.username}</div>
            <div>密码：<span id="password_${index}">********</span></div>
            <button onclick="togglePassword(${index}, '${record.password}')">显示</button>
        `;
        container.appendChild(item);
    });

    container.style.display = 'block';
}

/**
 * 切换密码的显示/隐藏状态
 * @param {number} index - 密码记录的索引
 * @param {string} password - 实际密码
 */
function togglePassword(index, password) {
    const passwordElement = document.getElementById(`password_${index}`);
    const button = passwordElement.nextElementSibling;
    
    if (button.textContent === '显示') {
        passwordElement.textContent = password;
        button.textContent = '隐藏';
    } else {
        passwordElement.textContent = '********';
        button.textContent = '显示';
    }
}