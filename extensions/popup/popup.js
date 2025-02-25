let loginRecords = [];
let passwordStrengthSettings = {
    minLength: 8,
    maxLength: 16,
    minDigits: 1,
    minSpecialChars: 1,
    minUpperCaseLetters: 1,
    minLowerCaseLetters: 1
};

async function loadSettings() {
    const result = await new Promise((resolve) => {
        chrome.storage.local.get('passwordStrengthSettings', function (res) {
            if (res.passwordStrengthSettings) {
                passwordStrengthSettings = res.passwordStrengthSettings;
            }
            resolve(passwordStrengthSettings);
        });
    });
    return result;
}

async function saveSettings(settings) {
    await new Promise((resolve) => {
        chrome.storage.local.set({ passwordStrengthSettings: settings }, function () {
            passwordStrengthSettings = settings;
            resolve();
        });
    });
}
//正则
function isPasswordMeetStandard(password) {
    let digitCount = 0;
    let specialCharCount = 0;
    let upperCaseLetterCount = 0;
    let lowerCaseLetterCount = 0;

    for (let char of password) {
        if (/[0-9]/.test(char)) {
            digitCount++;
        } else if (/[^\w]/.test(char)) {
            specialCharCount++;
        } else if (/[A-Z]/.test(char)) {
            upperCaseLetterCount++;
        } else if (/[a-z]/.test(char)) {
            lowerCaseLetterCount++;
        }
    }

    return password.length >= passwordStrengthSettings.minLength &&
        password.length <= passwordStrengthSettings.maxLength &&
        digitCount >= passwordStrengthSettings.minDigits &&
        specialCharCount >= passwordStrengthSettings.minSpecialChars &&
        upperCaseLetterCount >= passwordStrengthSettings.minUpperCaseLetters &&
        lowerCaseLetterCount >= passwordStrengthSettings.minLowerCaseLetters;
}

async function getCurrentTabUrl() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (chrome.runtime.lastError) {
                console.error('[密码管理] 获取当前标签页失败:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
                return;
            }
            if (tabs[0]) {
                console.log('[密码管理] 当前标签页URL:', tabs[0].url);
                resolve(tabs[0].url);
            } else {
                reject(new Error('未找到当前标签页'));
            }
        });
    });
}

chrome.runtime.onMessage.addListener(async function(message) {
    if (message.type === 'LOGIN_SUCCESS') {
        console.log('[密码管理] 收到登录成功消息', {
            url: message.data.url,
            username: message.data.username,
            passwordLength: message.data.password.length
        });
        
        const { username, password, url } = message.data;
        
        // 创建新记录
        const newRecord = {
            url: url,
            username: username,
            password: password,
            passwordMeetStandard: isPasswordMeetStandard(password),
            timestamp: new Date().toISOString()
        };

        console.log('[密码管理] 创建新记录', {
            url: newRecord.url,
            username: newRecord.username,
            isStandard: newRecord.passwordMeetStandard,
            timestamp: newRecord.timestamp
        });

        // 获取并更新存储的记录
        chrome.storage.local.get('loginRecords', function(result) {
            let records = result.loginRecords || [];
            console.log('[密码管理] 当前存储记录数量:', records.length);
            
            // 处理相同网站的记录
            const sameUrlIndex = records.findIndex(record => 
                new URL(record.url).origin === new URL(url).origin
            );

            if (sameUrlIndex !== -1) {
                console.log('[密码管理] 更新现有记录', {
                    url: url,
                    oldUsername: records[sameUrlIndex].username,
                    newUsername: username
                });
                records[sameUrlIndex] = newRecord;
            } else {
                console.log('[密码管理] 添加新记录', {
                    url: url,
                    username: username
                });
                records.push(newRecord);
            }

            // 保存更新后的记录
            chrome.storage.local.set({ loginRecords: records }, function() {
                console.log('[密码管理] 保存成功，当前总记录数:', records.length);
                
                // 检查密码强度并提示
                if (!newRecord.passwordMeetStandard) {
                    console.log('[密码管理] 检测到不符合标准的密码');
                    if (window.confirm('检测到你的密码不符合标准，建议生成合格密码！')) {
                        document.getElementById('generatePasswordButton').click();
                    }
                }
                
                // 更新显示
                displayRecords();
            });
        });
    }
});

function getLoginInfo() {
    const usernameInput = document.querySelector('input[type="text"]');
    const passwordInput = document.querySelector('input[type="password"]');

    return {
        username: usernameInput? usernameInput.value : '',
        password: passwordInput? passwordInput.value : ''
    };
}

function displayRecords() {
    console.log('[密码管理] 开始显示记录');
    chrome.storage.local.get('loginRecords', function (result) {
        const records = result.loginRecords || [];
        console.log('[密码管理] 加载记录数量:', records.length);

        document.getElementById('recordList').innerHTML = '';

        records.forEach((record, index) => {
            console.log('[密码管理] 处理记录', {
                index: index,
                url: record.url,
                username: record.username,
                isStandard: record.passwordMeetStandard
            });
            
            const passwordMeetStandard = isPasswordMeetStandard(record.password);
            const listItem = document.createElement('li');
            listItem.innerHTML = `网站：${record.url}<br>用户名：${record.username}<br>密码：<span id="maskedRecordPassword_${index}">${Array(record.password.length).join('*')}</span><br><span class="password-strength">密码是否符合标准：${passwordMeetStandard? '是' : '否'}</span>`;

            // 添加显示/隐藏按钮
            const showHideButton = document.createElement('button');
            showHideButton.textContent = '显示';
            showHideButton.addEventListener('click', function () {
                const passwordElement = document.getElementById(`maskedRecordPassword_${index}`);
                if (showHideButton.textContent === '显示') {
                    passwordElement.textContent = record.password;
                    showHideButton.textContent = '隐藏';
                } else {
                    passwordElement.textContent = Array(record.password.length).join('*');
                    showHideButton.textContent = '显示';
                }
            });
            listItem.appendChild(showHideButton);

            // 添加删除按钮
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '删除';
            deleteButton.className = 'delete-button';
            deleteButton.addEventListener('click', function () {
                deleteRecord(index);
            });
            listItem.appendChild(deleteButton);

            document.getElementById('recordList').appendChild(listItem);
        });
        document.getElementById('viewRecordsButton').textContent = '取消查看';
        document.getElementById('recordList').style.display = 'block';
        
        console.log('[密码管理] 记录显示完成');
    });
}

function deleteRecord(index) {
    console.log('[密码管理] 尝试删除记录', { index: index });
    
    if (confirm('确定要删除这条记录吗?')) {
        chrome.storage.local.get('loginRecords', function (result) {
            let records = result.loginRecords || [];
            const deletedRecord = records[index];
            
            console.log('[密码管理] 删除记录', {
                url: deletedRecord.url,
                username: deletedRecord.username
            });
            
            records.splice(index, 1);
            
            chrome.storage.local.set({ loginRecords: records }, function () {
                console.log('[密码管理] 记录删除成功，剩余记录数:', records.length);
                displayRecords();
            });
        });
    } else {
        console.log('[密码管理] 取消删除记录');
    }
}

// 将所有DOM操作封装到init函数中
function initializePopup() {
    const viewRecordsButton = document.getElementById('viewRecordsButton');
    const showHidePassword = document.getElementById('showHidePassword');
    const generatedPasswordInput = document.getElementById('generatedPassword');
    const generatePasswordButton = document.getElementById('generatePasswordButton');
    
    // 检查必要的DOM元素是否存在
    if (!viewRecordsButton || !showHidePassword || !generatedPasswordInput || 
        !generatePasswordButton) {
        console.error('[密码管理] 部分必要的DOM元素未找到');
        return;
    }

    // 为查看记录按钮添加点击事件监听器
    viewRecordsButton.addEventListener('click', function() {
        if (this.textContent === '查看记录') {
            displayRecords();
        } else {
            document.getElementById('recordList').style.display = 'none';
            this.textContent = '查看记录';
        }
    });

    // 为显示/隐藏密码按钮添加点击事件监听器
    showHidePassword.addEventListener('click', function() {
        const passwordElement = document.getElementById('maskedPassword');
        if (!passwordElement) {
            console.error('[密码管理] 未找到密码显示元素');
            return;
        }

        if (loginRecords.length > 0) {
            const realPassword = loginRecords[loginRecords.length - 1].password;
            if (this.textContent === '显示') {
                passwordElement.textContent = realPassword;
                this.textContent = '隐藏';
            } else {
                passwordElement.textContent = '*'.repeat(realPassword.length);
                this.textContent = '显示';
            }
        } else {
            alert('没有可显示的密码记录');
        }
    });

    // 为生成密码按钮添加点击事件监听器
    generatePasswordButton.addEventListener('click', function() {
        const newPassword = generatePassword();
        generatedPasswordInput.value = newPassword;
    });

    // 加载设置
    loadInitialSettings();
}

// 初始化设置
async function loadInitialSettings() {
    try {
        const settings = await loadSettings();
        const inputs = {
            minLength: document.getElementById('minLengthInput'),
            maxLength: document.getElementById('maxLengthInput'),
            minDigits: document.getElementById('minDigitsInput'),
            minSpecialChars: document.getElementById('minSpecialCharsInput'),
            minUpperCaseLetters: document.getElementById('minUpperCaseLettersInput'),
            minLowerCaseLetters: document.getElementById('minLowerCaseLettersInput')
        };

        // 检查所有输入框是否存在
        Object.entries(inputs).forEach(([key, element]) => {
            if (!element) {
                console.error(`[密码管理] 未找到${key}输入框`);
                return;
            }
            element.value = settings[key];
        });

    } catch (error) {
        console.error('[密码管理] 加载设置失败:', error);
    }
}

function generatePassword() {
    const { minLength, maxLength, minDigits, minSpecialChars, minUpperCaseLetters, minLowerCaseLetters } = passwordStrengthSettings;
    const charset = {
        digits: '0123456789',
        specialChars: '!@#$%^&*()-_=+[]{}\\|;:\'",./<>?',
        upperCaseLetters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowerCaseLetters: 'abcdefghijklmnopqrstuvwxyz'
    };
    let password = '';
    let remainingLength = Math.max(minLength, Math.min(maxLength, 100)); // 限制最大长度为100以防不合理设置

    // 先添加满足最小个数要求的各类字符
    for (let i = 0; i < minDigits; i++) {
        password += charset.digits[Math.floor(Math.random() * charset.digits.length)];
    }
    for (let i = 0; i < minSpecialChars; i++) {
        password += charset.specialChars[Math.floor(Math.random() * charset.specialChars.length)];
    }
    for (let i = 0; i < minUpperCaseLetters; i++) {
        password += charset.upperCaseLetters[Math.floor(Math.random() * charset.upperCaseLetters.length)];
    }
    for (let i = 0; i < minLowerCaseLetters; i++) {
        password += charset.lowerCaseLetters[Math.floor(Math.random() * charset.lowerCaseLetters.length)];
    }

    remainingLength -= password.length;

    // 用剩余长度随机填充字符，保证最终长度在要求范围内
    const allChars = Object.values(charset).join('');
    while (remainingLength > 0) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
        remainingLength--;
    }

    // 打乱密码字符顺序，增加随机性
    password = password.split('').sort(() => 0.5 - Math.random()).join('');

    return password;
}

async function updateAllRecords() {
    const result = await new Promise((resolve) => {
        chrome.storage.local.get('loginRecords', function (res) {
            resolve(res.loginRecords);
        });
    });
    loginRecords = result || [];
    displayRecords();
}

// 复制密码到剪贴板的函数
async function copyToClipboard() {
    const generatedPasswordInput = document.getElementById('generatedPassword');
    if (generatedPasswordInput.value === "") {
        alert('复制失败，输出框为空');
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = generatedPasswordInput.value;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        await navigator.clipboard.writeText(textarea.value);
        alert('密码已复制到剪贴板');
    } catch (err) {
        alert('复制失败: ' + err);
    }
    document.body.removeChild(textarea);
}

async function getChromePasswords() {
    console.log('[密码管理] 开始获取保存的密码');
    try {
        // 通过 chrome.identity API 获取授权
        await new Promise((resolve) => {
            chrome.identity.getAuthToken({ interactive: true }, function(token) {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve(token);
            });
        });

        // 获取当前域名下保存的密码
        const currentUrl = await getCurrentTabUrl();
        const domain = new URL(currentUrl).origin;

        console.log('[密码管理] 正在获取域名密码:', domain);

        // 使用 chrome.storage API 获取已保存的密码
        chrome.storage.local.get('loginRecords', function(result) {
            let records = result.loginRecords || [];
            console.log('[密码管理] 当前存储记录数:', records.length);

            // 筛选当前域名的密码记录
            const domainRecords = records.filter(record => 
                new URL(record.url).origin === domain
            );

            if (domainRecords.length > 0) {
                console.log('[密码管理] 找到域名相关记录:', domainRecords.length);
                displayDomainPasswords(domainRecords);
            } else {
                console.log('[密码管理] 未找到域名相关记录');
                alert('未找到当前网站的保存密码');
            }
        });

    } catch (error) {
        console.error('[密码管理] 获取密码失败:', error);
        alert('获取密码失败: ' + error.message);
    }
}

// 显示特定域名的密码
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

// 切换密码显示/隐藏
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

// 显示域名密码
function displayDomainPasswords(records, domain) {
    const container = document.getElementById('domainPasswords');
    container.innerHTML = '';

    if (records.length === 0) {
        container.innerHTML = `<p>未找到 ${domain} 的保存密码</p>`;
    } else {
        records.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'password-item';
            
            const maskedPassword = '*'.repeat(record.password.length);
            
            item.innerHTML = `
                <div class="password-record">
                    <div>用户名：${record.username}</div>
                    <div>密码：<span id="domain_password_${index}">${maskedPassword}</span></div>
                    <button class="toggle-password" data-index="${index}">显示</button>
                    <button class="copy-password" data-index="${index}">复制</button>
                </div>
            `;
            container.appendChild(item);
        });

        // 添加密码显示/隐藏事件
        container.querySelectorAll('.toggle-password').forEach((button, index) => {
            button.addEventListener('click', function() {
                const passwordSpan = document.getElementById(`domain_password_${index}`);
                if (this.textContent === '显示') {
                    passwordSpan.textContent = records[index].password;
                    this.textContent = '隐藏';
                } else {
                    passwordSpan.textContent = '*'.repeat(records[index].password.length);
                    this.textContent = '显示';
                }
            });
        });

        // 添加复制密码事件
        container.querySelectorAll('.copy-password').forEach((button, index) => {
            button.addEventListener('click', function() {
                navigator.clipboard.writeText(records[index].password)
                    .then(() => alert('密码已复制到剪贴板'))
                    .catch(err => alert('复制失败: ' + err));
            });
        });
    }

    container.style.display = 'block';
}

const WEB_URL = 'http://localhost:3000';

// 检查登录状态
async function checkLoginStatus() {
  // 从插件自己的 chrome.storage 中获取 token
  try {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get('webToken', (result) => {
        resolve(result.webToken);
      });
    });

    if (!result) {
      console.log('[密码管理] 未找到token');
      showNotLoggedIn();
      return;
    }

    // 验证 token 有效性
    const response = await fetch(`${WEB_URL}/api/user/info`, {
      headers: {
        'Authorization': result
      }
    });

    if (response.ok) {
      const data = await response.json();
      // 验证成功后保存用户信息
      await new Promise((resolve) => {
        chrome.storage.local.set({
          userInfo: data
        }, resolve);
      });
      showLoggedIn(data);
    } else {
      // token 失效，清除存储
      await new Promise((resolve) => {
        chrome.storage.local.remove(['webToken', 'userInfo'], resolve);
      });
      showNotLoggedIn();
    }
  } catch (error) {
    console.error('[密码管理] 验证登录状态失败:', error);
    showNotLoggedIn();
  }
}

// 显示未登录状态
function showNotLoggedIn() {
  document.getElementById('notLoggedIn').style.display = 'block';
  document.getElementById('loggedIn').style.display = 'none';
}

// 显示已登录状态
function showLoggedIn(userInfo) {
  document.getElementById('notLoggedIn').style.display = 'none';
  document.getElementById('loggedIn').style.display = 'block';
  document.getElementById('username').textContent = userInfo.username;
}

// 初始化事件监听
document.addEventListener('DOMContentLoaded', () => {
  // 检查登录状态
  checkLoginStatus();

  // 登录按钮点击事件
  document.getElementById('goToLogin').addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_URL}/login` });
  });

  // 设置按钮点击事件 
  document.getElementById('goToSettings').addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_URL}/settings` });
  });

  // 账户管理按钮点击事件
  document.getElementById('goToAccounts').addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_URL}/account` });
  });
});

// 监听来自网页的消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'LOGIN_SUCCESS') {
    console.log('[密码管理] 收到登录成功消息');
    // 保存 token 到插件的 storage
    chrome.storage.local.set({
      webToken: message.data.token,
      userInfo: message.data.userInfo
    }, () => {
      checkLoginStatus();
    });
  }
});

// 检查登录状态并初始化popup
async function initPopup() {
  console.log('[密码管理] 初始化popup');
  
  // 首先检查登录状态
  await checkLoginStatus();
  
  // 加载设置
  await loadInitialSettings();
  
  // 绑定事件监听器
  initializeEventListeners();
}

// 初始化所有事件监听器
function initializeEventListeners() {
  // 登录按钮点击事件
  document.getElementById('goToLogin')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_URL}/login` });
  });

  // 设置按钮点击事件
  document.getElementById('goToSettings')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_URL}/settings` });
  });

  // 账户管理按钮点击事件
  document.getElementById('goToAccounts')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_URL}/account` });
  });

  // 初始化其他按钮事件
  // initializePopup();
}

// 在DOM加载完成后执行初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('[密码管理] DOM加载完成，开始初始化');
  initPopup().catch(error => {
    console.error('[密码管理] 初始化失败:', error);
  });
});

// 监听来自网页的消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'LOGIN_SUCCESS') {
    console.log('[密码管理] 收到登录成功消息');
    checkLoginStatus();
  }
});