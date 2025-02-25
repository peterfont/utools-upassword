import { createRouter, createWebHistory } from 'vue-router'
import cookie from 'vue-cookies'
import { isURL } from '@/utils/validate'
import { clearLoginInfo } from '@/utils'
import Layout from '@/layout/main.vue'
import Login from '@/views/common/login/index.vue'

// 全局路由(无需嵌套上左右整体布局)
const globalRoutes = [
  {
    path: '/404',
    component: () => import('@/views/common/error-page/404.vue'),
    name: '404',
    meta: { title: '404未找到' }
  },
  {
    path: '/login',
    component: Login,
    name: 'login',
    meta: { title: '登录' }
  }
]

export const mainRoutes = {
  path: '/',
  component: Layout,
  name: 'home',
  redirect: '/user/user',
  children: [
    {
      path: 'home',
      name: 'home',
      component: () => import('@/views/common/home/index.vue')
    },
    {
      path: '/prodInfo',
      name: 'prodInfo',
      component: () => import('@/views/modules/prod/prodInfo/index.vue')
    }
  ],
  // eslint-disable-next-line no-unused-vars
  beforeEnter (to, from, next) {
    const authorization = cookie.get('Authorization')
    if (!authorization || !/\S/.test(authorization)) {
      clearLoginInfo()
      next({ name: 'login' })
    }
    next()
  }
}

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  isAddDynamicMenuRoutes: false, // 是否已经添加动态(菜单)路由
  routes: globalRoutes
})

// Static menuList data
const menuList = [
  {
    menuId: 317,
    parentId: 0,
    parentName: null,
    name: '账户管理',
    url: '',
    perms: '',
    type: 0,
    icon: 'role',
    orderNum: 0,
    list: [
      {
        menuId: 318,
        parentId: 317,
        parentName: null,
        name: '账户管理',
        url: '/user/user',
        perms: '',
        type: 1,
        icon: 'icon-role',
        orderNum: 0,
        list: null
      }
    ]
  }
]

// eslint-disable-next-line no-unused-vars
router.beforeEach((to, from, next) => {
  const commonStore = useCommonStore()
  // 添加动态(菜单)路由
  if (router.options.isAddDynamicMenuRoutes || fnCurrentRouteType(to, globalRoutes) === 'global') {
    next()
  } else {
    sessionStorage.setItem('Authorities', JSON.stringify([]))
    fnAddDynamicMenuRoutes(menuList)
    router.options.isAddDynamicMenuRoutes = true
    const rList = []
    menuList.forEach(item => {
      item.isLeftMenu = item.parentId === 0
      rList.push({
        menuId: item.menuId,
        name: item.name,
        parentId: item.parentId,
        url: item.url
      })
      if (item.list) {
        item.list.forEach(item1 => {
          item1.isLeftMenu = item1.parentId === 0
          rList.push({
            menuId: item1.menuId,
            name: item1.name,
            parentId: item1.parentId,
            url: item1.url
          })
        })
      }
    })
    sessionStorage.setItem('menuList', JSON.stringify(menuList || '[]'))
    commonStore.updateRouteList(rList)
    commonStore.updateMenuIds(rList)
    next({ ...to, replace: true })
  }
})

/**
 * 判断当前路由类型, global: 全局路由, main: 主入口路由
 * @param {*} route 当前路由
 * @param globalRoutes 全局路由
 */
function fnCurrentRouteType (route, globalRoutes = []) {
  let temp = []
  for (let i = 0; i < globalRoutes.length; i++) {
    if (route.path === globalRoutes[i].path) {
      return 'global'
    } else if (globalRoutes[i].children && globalRoutes[i].children.length >= 1) {
      temp = temp.concat(globalRoutes[i].children)
    }
  }
  return temp.length >= 1 ? fnCurrentRouteType(route, temp) : 'main'
}

/**
 * 添加动态(菜单)路由
 * @param {*} menuList 菜单列表
 * @param {*} routes 递归创建的动态(菜单)路由
 */
function fnAddDynamicMenuRoutes (menuList = [], routes = []) {
  let temp = []
  const modules = import.meta.glob('../views/modules/**/index.vue')
  for (let i = 0; i < menuList.length; i++) {
    if (menuList[i].list && menuList[i].list.length >= 1) {
      temp = temp.concat(menuList[i].list)
    } else if (menuList[i].url && /\S/.test(menuList[i].url)) {
      menuList[i].url = menuList[i].url.replace(/^\//, '')
      const route = {
        path: menuList[i].url,
        component: null,
        name: menuList[i].url,
        meta: {
          menuId: menuList[i].menuId,
          title: menuList[i].name,
          isDynamic: true,
          isTab: true,
          iframeUrl: ''
        }
      }
      // url以http[s]://开头, 通过iframe展示
      if (isURL(menuList[i].url)) {
        route.path = `i-${menuList[i].menuId}`
        route.name = `i-${menuList[i].menuId}`
        route.meta.iframeUrl = menuList[i].url
      } else {
        try {
          route.component = modules[`../views/modules/${menuList[i].url}/index.vue`] || null
        } catch (e) {}
      }
      routes.push(route)
    }
  }
  if (temp.length >= 1) {
    fnAddDynamicMenuRoutes(temp, routes)
  } else {
    mainRoutes.name = 'main-dynamic'
    mainRoutes.children = routes
    router.addRoute(mainRoutes)
  }
  router.addRoute({ path: '/:pathMatch(.*)*', redirect: { name: '404' } })
}

export default router
