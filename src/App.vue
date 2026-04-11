<template>
  <a-layout class="app-container">
    <a-layout-sider width="200" style="background: #001529;">
      <div class="logo">
        <h1 style="color: white; text-align: center; margin: 16px 0; font-size: 16px;">无人机指挥驾驶舱</h1>
      </div>
      <a-menu
        mode="inline"
        theme="dark"
        :selected-keys="[currentRoute]"
        @select="handleMenuSelect"
      >
        <a-menu-item key="/drones">
          <template #icon><RobotOutlined /></template>
          无人机管理
        </a-menu-item>
        <a-menu-item key="/tasks">
          <template #icon><ScheduleOutlined /></template>
          任务管理
        </a-menu-item>
        <a-menu-item key="/flight-data">
          <template #icon><AreaChartOutlined /></template>
          飞行数据
        </a-menu-item>
        <a-menu-item key="/map3d">
          <template #icon><EnvironmentOutlined /></template>
          3D态势图
        </a-menu-item>
        <a-menu-item key="/control-matrix">
          <template #icon><ControlOutlined /></template>
          指挥矩阵
        </a-menu-item>
        <a-menu-item key="/users">
          <template #icon><UserOutlined /></template>
          用户管理
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header style="background: white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); height: 64px;">
        <div class="header-content">
          <div class="header-left">
            <a-dropdown>
              <a-button type="primary">
                <SettingOutlined /> 系统设置
              </a-button>
            </a-dropdown>
          </div>
          <div class="header-right" v-if="user">
            <a-badge count="3" style="margin-right: 16px;">
              <BellOutlined style="font-size: 18px; color: #666;" />
            </a-badge>
            <a-avatar size="small" style="margin-right: 16px;">
              <template #icon><UserOutlined /></template>
            </a-avatar>
            <span style="margin-right: 16px;">{{ user.name || user.username }}</span>
            <a-button type="text" @click="handleLogout">退出</a-button>
          </div>
        </div>
      </a-layout-header>
      <a-layout-content style="padding: 24px; background: #f0f2f5; min-height: calc(100vh - 64px);">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { RobotOutlined, ScheduleOutlined, AreaChartOutlined, EnvironmentOutlined, ControlOutlined, SettingOutlined, BellOutlined, UserOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const user = ref<any>(null)

const currentRoute = computed(() => route.path)

const handleMenuSelect = (info: any) => {
  router.push(info.key)
}

const handleLogout = () => {
  // 清除本地存储的用户信息
  localStorage.removeItem('user')
  // 重定向到登录页
  router.push('/login')
}

const loadUser = () => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    user.value = JSON.parse(userStr)
  }
}

onMounted(() => {
  loadUser()
})
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  background-color: #f5f5f5;
}

.app-container {
  min-height: 100vh;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }
}
</style>
