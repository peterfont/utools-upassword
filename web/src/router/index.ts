import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Layout from '../layout/index.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/index.vue'),
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/extension-bridge',
    name: 'ExtensionBridge',
    component: () => import('../views/extension-bridge/index.vue'),
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/account',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: 'account',
        name: 'Account',
        component: () => import('../views/account/index.vue'),
        meta: {
          requiresAuth: true
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 白名单路由（不需要登录即可访问）
const whiteList = ['/login', '/extension-bridge']

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  // 已登录状态访问登录页，重定向到首页
  if (to.path === '/login' && token) {
    next('/')
    return
  }

  // 白名单路由直接放行
  if (whiteList.includes(to.path)) {
    next()
    return
  }

  // 需要认证的页面，检查是否已登录
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router