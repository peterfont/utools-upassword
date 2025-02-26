(function() {
    // 缓存的登录信息
    let cachedLoginInfo = null;
    let isInitialized = false;

    // 通用选择器定义
    const selectors = {
        // 密码输入框选择器
        password: [
            'input[type="password"]',
            'input[name*="pass"]', 
            'input[id*="pass"]',
            '[aria-label*="密码"]',
            '[placeholder*="密码"]'
        ],
        // 用户名输入框选择器
        username: [
            'input[type="text"]',
            'input[type="email"]',
            'input[name*="user"]',
            'input[name*="email"]',
            '[aria-label*="用户"]',
            '[aria-label*="账号"]'
        ]
    };

    /**
     * 递归查找包括 Shadow DOM 在内的所有匹配元素
     * @param {Element} root - 根节点 
     * @param {string} selector - CSS选择器
     * @returns {Element[]} 匹配的元素数组
     */
    function deepQuerySelector(root, selector) {
        // 查找普通DOM元素
        const elements = Array.from(root.querySelectorAll(selector));
        
        // 查找Shadow DOM中的元素
        const shadows = Array.from(root.querySelectorAll('*'))
            .filter(el => el.shadowRoot)
            .map(el => deepQuerySelector(el.shadowRoot, selector))
            .flat();
            
        return [...elements, ...shadows];
    }

    /**
     * 查找用户名和密码输入框
     * @returns {{password: Element|null, username: Element|null}} 找到的表单元素
     */
    function findFormElements() {
        const results = {
            password: null,
            username: null
        };

        // 遍历查找用户名和密码输入框
        for (const [type, selectorList] of Object.entries(selectors)) {
            for (const selector of selectorList) {
                const elements = deepQuerySelector(document.documentElement, selector);
                
                for (const element of elements) {
                    if (element.value) {
                        results[type] = element;
                        break;
                    }
                }
                if (results[type]) break;
            }
        }

        return results;
    }


    // 初始化函数
    async function init() {
        if (isInitialized) {
            return;
        }
        watchAutofill(); // 监听自动填充
        watchLoginAttempts(); // 监听登录行为
        isInitialized = true;
    }


    // 缓存登录信息
    function cacheLoginInfo(elements) {
        // 加密密码
        const password = elements.password.value;
        
        cachedLoginInfo = {
            username: elements.username ? elements.username.value : '',
            password, // 存储加密后的密码
            url: window.location.href,
        };
    }

    // 监听自动填充
    function watchAutofill() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                    const elements = findFormElements();
                    if (elements.password && elements.password.value) {
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
    /**
     * 监听登录行为
     * - 表单提交
     * - 登录按钮点击
     * - 回车键提交
     * - 网络请求
     */
    function watchLoginAttempts() {
        // 表单提交监听
        document.addEventListener('submit', handleLoginAttempt, true);

        // 登录按钮点击监听  
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
                handleLoginAttempt(e);
            }
        }, true);

        // 回车键监听
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement && 
                    (activeElement.tagName === 'INPUT' || 
                    activeElement.tagName === 'BUTTON')) {
                    handleLoginAttempt(e);
                }
            }
        }, true);

        // 监听网络请求
        const originalFetch = window.fetch;
        window.fetch = async function(url, options = {}) {
            const response = await originalFetch.apply(this, arguments);
            
            if (typeof url === 'string' && 
                (url.includes('login') || 
                url.includes('auth') || 
                url.includes('signin'))) {
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
                                handleLoginAttempt();
                            }
                        }
                    }
                });
            }
        }
        watchFormInputs();
    }

    /**
     * 处理登录尝试
     * @param {Event} [event] - 触发事件对象
     */
    async function handleLoginAttempt(event) {
        const elements = findFormElements();
        if (!elements.password || !elements.password.value) return;

        // 缓存登录信息

        console.log('缓存登录信===11===>', cacheLoginInfo);
        console.log('缓存登录信===222===>', elements);

        const loginInfo = {
            username: cacheLoginInfo ? cacheLoginInfo.username : elements.username ? elements.username.value : '',
            password: cacheLoginInfo ? cacheLoginInfo.password : elements.password ? elements.password.value : '',
            url: window.location.href
        };

        try {
            await chrome.runtime.sendMessage({
                type: 'CACHE_LOGIN_INFO',
                data: loginInfo
            });
            console.log('缓存登录信息成功', loginInfo);
        } catch (error) {
            // 忽略错误
        }
    }

    // 初始化插件
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();