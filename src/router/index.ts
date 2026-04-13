import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Drones from '../views/Drones.vue'
import Tasks from '../views/Tasks.vue'
import FlightData from '../views/FlightData.vue'
import Map3D from '../views/Map3D.vue'
import ControlMatrix from '../views/ControlMatrix.vue'
import Login from '../views/Login.vue'
import Users from '../views/Users.vue'
import Routes from '../views/Routes.vue'
import MediaManagement from '../views/MediaManagement.vue'
import RecognitionData from '../views/RecognitionData.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    redirect: '/drones'
  },
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/drones',
    name: 'drones',
    component: Drones,
    meta: { requiresAuth: true }
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: Tasks,
    meta: { requiresAuth: true }
  },
  {
    path: '/flight-data',
    name: 'flight-data',
    component: FlightData,
    meta: { requiresAuth: true }
  },
  {
    path: '/map3d',
    name: 'map3d',
    component: Map3D,
    meta: { requiresAuth: true }
  },
  {
    path: '/control-matrix',
    name: 'control-matrix',
    component: ControlMatrix,
    meta: { requiresAuth: true }
  },
  {
    path: '/users',
    name: 'users',
    component: Users,
    meta: { requiresAuth: true }
  },
  {
    path: '/routes',
    name: 'routes',
    component: Routes,
    meta: { requiresAuth: true }
  },
  {
    path: '/media',
    name: 'media',
    component: MediaManagement,
    meta: { requiresAuth: true }
  },
  {
    path: '/recognition',
    name: 'recognition',
    component: RecognitionData,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查路由是否需要认证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // 检查用户是否已登录
  const isLoggedIn = localStorage.getItem('user') !== null

  if (requiresAuth && !isLoggedIn) {
    // 未登录，重定向到登录页
    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    // 已登录，重定向到首页
    next('/drones')
  } else {
    // 正常访问
    next()
  }
})

export default router
