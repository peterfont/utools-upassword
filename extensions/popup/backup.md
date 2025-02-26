 ``` html
    <h2>密码强度标准设置</h2>
    <div class="settings-group">
        <label for="minLengthInput">最小长度：</label><input type="number" id="minLengthInput" /><br>
        <label for="maxLengthInput">最大长度：</label><input type="number" id="maxLengthInput" /><br>
        <label for="minDigitsInput">最少数字个数：</label><input type="number" id="minDigitsInput" /><br>
        <label for="minSpecialCharsInput">最少特殊字符个数：</label><input type="number" id="minSpecialCharsInput" /><br>
        <label for="minUpperCaseLettersInput">最少大写字母个数：</label><input type="number" id="minUpperCaseLettersInput" /><br>
        <label for="minLowerCaseLettersInput">最少小写字母个数：</label><input type="number" id="minLowerCaseLettersInput" /><br>
    </div>
    <button id="saveSettingsButton">保存设置</button>
    <button id="generatePasswordButton">生成合格密码</button>
    <div id="generatedPasswordContainer">
        <input type="text" id="generatedPassword" readonly />
        <button id="copyButton">复制</button>
    </div>
```

```javascript


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
// ---
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
// ---
// 为显示/隐藏密码按钮添加点击事件监听器
document.getElementById('showHidePassword').addEventListener('click', function () {
    const passwordElement = document.getElementById('maskedPassword');
    if (loginRecords.length > 0) {
        const realPassword = loginRecords[loginRecords.length - 1].password;
        if (this.textContent === '显示') {
            passwordElement.textContent = realPassword;
            this.textContent = '隐藏';
        } else {
            passwordElement.textContent = Array(realPassword.length).join('*');
            this.textContent = '显示';
        }
    } else {
        alert('没有可显示的密码记录');
    }
});


// ----- 

const minLengthInput = document.getElementById('minLengthInput');
const maxLengthInput = document.getElementById('maxLengthInput');
const minDigitsInput = document.getElementById('minDigitsInput');
const minSpecialCharsInput = document.getElementById('minSpecialCharsInput');
const minUpperCaseLettersInput = document.getElementById('minUpperCaseLettersInput');
const minLowerCaseLettersInput = document.getElementById('minLowerCaseLettersInput');
const saveSettingsButton = document.getElementById('saveSettingsButton');
const generatePasswordButton = document.getElementById('generatePasswordButton');
const generatedPasswordInput = document.getElementById('generatedPassword');
const copyButton = document.getElementById('copyButton');

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

// 为保存设置按钮添加点击事件监听器
saveSettingsButton.addEventListener('click', async function () {
    const minLength = parseInt(minLengthInput.value);
    const maxLength = parseInt(maxLengthInput.value);
    const minDigits = parseInt(minDigitsInput.value);
    const minSpecialChars = parseInt(minSpecialCharsInput.value);

    const minUpperCaseLetters = parseInt(minUpperCaseLettersInput.value);
    const minLowerCaseLetters = parseInt(minLowerCaseLettersInput.value);

    if (minLength > maxLength) {
        alert('最小长度不能大于最大长度，请重新输入。');
        return;
    }

    passwordStrengthSettings.minLength = minLength;
    passwordStrengthSettings.maxLength = maxLength;
    passwordStrengthSettings.minDigits = minDigits;
    passwordStrengthSettings.minSpecialChars = minSpecialChars;
    passwordStrengthSettings.minUpperCaseLetters = minUpperCaseLetters;
    passwordStrengthSettings.minLowerCaseLetters = minLowerCaseLetters;

    try {
        await saveSettings(passwordStrengthSettings);
        alert('设置已保存成功');

        // 重新获取所有记录并刷新显示状态
        await updateAllRecords();
    } catch (error) {
        console.log('保存设置失败：', error);
    }
} );

// 为生成合格密码按钮添加点击事件监听器
generatePasswordButton.addEventListener('click', function () {
    const newPassword = generatePassword();
    generatedPasswordInput.value = newPassword;
});

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

// 复制按钮事件监听器
copyButton.addEventListener('click', copyToClipboard);

// 为复制按钮添加点击事件监听器
copyButton.addEventListener('click', copyToClipboard);






// 在页面加载时加载已保存的设置
window.onload = async function () {
    const settings = await loadSettings();
    minLengthInput.value = settings.minLength;
    maxLengthInput.value = settings.maxLength;
    minDigitsInput.value = settings.minDigits;
    minSpecialCharsInput.value = settings.minSpecialChars;
    minUpperCaseLettersInput.value = settings.minUpperCaseLetters;
    minLowerCaseLettersInput.value = settings.minLowerCaseLetters;
    
};


// 获取当前网站的密码
async function getPasswordsForCurrentSite() {
    console.log('[密码管理] 开始获取当前网站密码');
    try {
        const currentUrl = await getCurrentTabUrl();
        const domain = new URL(currentUrl).origin;
        console.log('[密码管理] 当前域名:', domain);

        chrome.storage.local.get('loginRecords', function(result) {
            const records = result.loginRecords || [];
            console.log('[密码管理] 所有记录数量:', records.length);

            // 筛选当前域名的记录
            const domainRecords = records.filter(record => {
                try {
                    return new URL(record.url).origin === domain;
                } catch (e) {
                    console.error('[密码管理] URL解析错误:', e);
                    return false;
                }
            });

            console.log('[密码管理] 当前域名记录数量:', domainRecords.length);
            displayDomainPasswords(domainRecords, domain);
        });
    } catch (error) {
        console.error('[密码管理] 获取密码失败:', error);
        alert('获取密码失败: ' + error.message);
    }
}

function getLoginInfo() {
    const usernameInput = document.querySelector('input[type="text"]');
    const passwordInput = document.querySelector('input[type="password"]');

    return {
        username: usernameInput? usernameInput.value : '',
        password: passwordInput? passwordInput.value : ''
    };
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

```


``` javascript
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
```