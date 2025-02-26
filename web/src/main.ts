import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

const app = createApp(App)

// 使用中文配置
app.use(ElementPlus, {
  locale: zhCn,
})

app.use(createPinia())
app.use(router)

app.mount('#app')