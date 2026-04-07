<template>
  <div class="map3d-container">
    <a-card title="3D全域态势图" :bordered="false" class="map3d-card">
      <div class="map3d-header">
        <div class="map3d-controls">
          <a-select v-model:value="selectedDrone" style="width: 150px; margin-right: 16px;">
            <a-select-option value="all">所有无人机</a-select-option>
            <a-select-option v-for="drone in drones" :key="drone.id" :value="drone.id">{{ drone.name }}</a-select-option>
          </a-select>
          <a-select v-model:value="mapMode" style="width: 120px; margin-right: 16px;">
            <a-select-option value="normal">普通模式</a-select-option>
            <a-select-option value="route">航线规划</a-select-option>
          </a-select>
          <a-button type="primary" style="margin-right: 16px;" @click="refreshData">
            <SyncOutlined /> 刷新数据
          </a-button>
          <a-button type="default" @click="toggleTerrain">
            <GlobalOutlined /> {{ terrainEnabled ? '关闭地形' : '开启地形' }}
          </a-button>
        </div>
      </div>
      <div class="map3d-content">
        <div id="map3d" class="map3d"></div>
        <div class="map3d-sidebar">
          <a-card title="无人机状态" :bordered="false" class="status-card">
            <div class="status-item">
              <span class="status-label">在线:</span>
              <span class="status-value online">{{ onlineCount }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">飞行中:</span>
              <span class="status-value flying">{{ flyingCount }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">离线:</span>
              <span class="status-value offline">{{ offlineCount }}</span>
            </div>
          </a-card>
          <a-card title="选中无人机" :bordered="false" class="drone-card" v-if="selectedDroneInfo">
            <div class="info-item">
              <span class="info-label">名称:</span>
              <span class="info-value">{{ selectedDroneInfo.name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">型号:</span>
              <span class="info-value">{{ selectedDroneInfo.model }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">状态:</span>
              <span :class="['info-value', selectedDroneInfo.status]">{{ selectedDroneInfo.status }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">电量:</span>
              <span class="info-value">{{ selectedDroneInfo.battery }}%</span>
            </div>
            <div class="info-item">
              <span class="info-label">位置:</span>
              <span class="info-value">{{ selectedDroneInfo.location }}</span>
            </div>
          </a-card>
          <a-card title="航线规划" :bordered="false" class="route-card" v-if="mapMode === 'route'">
            <a-button type="primary" style="width: 100%; margin-bottom: 16px;" @click="startRoutePlanning">
              <EditOutlined /> 开始规划
            </a-button>
            <a-button type="default" style="width: 100%; margin-bottom: 16px;" @click="clearRoute">
              <CloseOutlined /> 清除航线
            </a-button>
            <a-button type="default" style="width: 100%;" @click="saveRoute">
              <SaveOutlined /> 保存航线
            </a-button>
          </a-card>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { droneAPI, Drone } from '../services/api'
import { SyncOutlined, GlobalOutlined, EditOutlined, CloseOutlined, SaveOutlined } from '@ant-design/icons-vue'

// 无人机数据
const drones = ref<Drone[]>([])
const selectedDrone = ref<number | 'all'>('all')
const selectedDroneInfo = ref<Drone | null>(null)
const mapMode = ref('normal')
const terrainEnabled = ref(false)

// 地图实例
let map: any = null
let markers: any[] = []
let routeMarkers: any[] = []
let routePolyline: any = null

// 计算无人机状态统计
const onlineCount = computed(() => {
  return drones.value.filter(drone => drone.status === 'online').length
})

const flyingCount = computed(() => {
  return drones.value.filter(drone => drone.status === 'flying').length
})

const offlineCount = computed(() => {
  return drones.value.filter(drone => drone.status === 'offline').length
})

// 加载无人机数据
const loadDrones = async () => {
  try {
    drones.value = await droneAPI.getDrones()
    updateMapMarkers()
  } catch (error) {
    console.error('Failed to load drones:', error)
  }
}

// 刷新数据
const refreshData = () => {
  loadDrones()
}

// 切换地形模式
const toggleTerrain = () => {
  terrainEnabled.value = !terrainEnabled.value
  if (map) {
    if (terrainEnabled.value) {
      // 开启地形模式
      map.enableTerrain()
    } else {
      // 关闭地形模式
      map.disableTerrain()
    }
  }
}

// 开始航线规划
const startRoutePlanning = () => {
  if (map) {
    // 监听地图点击事件，添加航点
    map.on('click', (e: any) => {
      const position = e.lnglat
      addRouteWaypoint(position)
    })
  }
}

// 添加航点
const addRouteWaypoint = (position: any) => {
  if (!map) return

  // 创建航点标记
  const marker = new AMap.Marker({
    position: position,
    icon: new AMap.Icon({
      size: new AMap.Size(30, 30),
      image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
      imageSize: new AMap.Size(30, 30)
    }),
    title: `航点 ${routeMarkers.length + 1}`,
    anchor: 'bottom-center'
  })

  // 添加标记到地图
  marker.setMap(map)
  routeMarkers.push(marker)

  // 更新航线
  updateRoutePolyline()
}

// 更新航线
const updateRoutePolyline = () => {
  if (!map || routeMarkers.length < 2) return

  // 清除旧航线
  if (routePolyline) {
    routePolyline.remove()
  }

  // 获取所有航点坐标
  const path = routeMarkers.map(marker => marker.getPosition())

  // 创建新航线
  routePolyline = new AMap.Polyline({
    path: path,
    strokeColor: '#1890ff',
    strokeWeight: 3,
    strokeOpacity: 0.8,
    lineJoin: 'round'
  })

  // 添加航线到地图
  routePolyline.setMap(map)
}

// 清除航线
const clearRoute = () => {
  // 清除航点标记
  routeMarkers.forEach(marker => marker.remove())
  routeMarkers = []

  // 清除航线
  if (routePolyline) {
    routePolyline.remove()
    routePolyline = null
  }

  // 移除地图点击事件
  if (map) {
    map.off('click')
  }
}

// 保存航线
const saveRoute = () => {
  if (routeMarkers.length < 2) {
    alert('请至少添加两个航点')
    return
  }

  // 获取所有航点坐标
  const waypoints = routeMarkers.map(marker => {
    const position = marker.getPosition()
    return {
      lat: position.getLat(),
      lng: position.getLng()
    }
  })

  console.log('保存航线:', waypoints)
  alert('航线保存成功')
}

// 监听选中的无人机变化
watch(selectedDrone, (newValue) => {
  if (newValue === 'all') {
    selectedDroneInfo.value = null
    updateMapMarkers()
  } else {
    selectedDroneInfo.value = drones.value.find(drone => drone.id === newValue) || null
    updateMapMarkers()
    // 定位到选中的无人机
    if (selectedDroneInfo.value && map) {
      // 模拟无人机位置坐标
      const locationMap: Record<string, [number, number]> = {
        '北京': [116.397428, 39.90923],
        '上海': [121.473701, 31.230416],
        '广州': [113.264385, 23.129111],
        '深圳': [114.057868, 22.543099],
        '杭州': [120.15507, 30.274085]
      }
      const position = locationMap[selectedDroneInfo.value.location] || [116.397428, 39.90923]
      // 设置地图中心为无人机位置
      map.setCenter(position)
      // 调整地图缩放级别
      map.setZoom(15)
    }
  }
})

// 初始化地图
const initMap = () => {
  // 加载高德地图API
  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = 'https://webapi.amap.com/maps?v=2.0&key=50dd5fa2e6ca9a17cdcbf727f2568928&plugin=AMap.3DMap,AMap.Terrain,AMap.Polyline,AMap.Marker,AMap.ToolBar,AMap.Scale,AMap.OverviewMap'
  script.onload = () => {
    // 初始化3D地图
    map = new AMap.Map('map3d', {
      zoom: 13,
      center: [116.397428, 39.90923], // 默认北京
      viewMode: '3D', // 开启3D模式
      pitch: 60, // 俯仰角
      rotation: 0 // 旋转角
    })

    // 添加控件
    try {
      map.addControl(new AMap.ToolBar())
      map.addControl(new AMap.Scale())
      // 移除 OverviewMap 控件，因为它不是一个有效的构造函数
    } catch (error) {
      console.error('Failed to add controls:', error)
    }

    // 加载无人机数据
    loadDrones()
  }
  document.head.appendChild(script)
}

// 清理地图实例
const cleanupMap = () => {
  if (map) {
    // 清除所有标记
    markers.forEach(marker => marker.remove())
    routeMarkers.forEach(marker => marker.remove())
    
    // 清除航线
    if (routePolyline) {
      routePolyline.remove()
    }
    
    // 移除事件监听器
    map.off('click')
    
    // 销毁地图实例
    map.destroy()
    map = null
  }
}

// 组件卸载时清理地图
onUnmounted(() => {
  cleanupMap()
})

// 更新地图标记
const updateMapMarkers = () => {
  if (!map) return

  // 清除旧标记
  markers.forEach(marker => marker.remove())
  markers = []

  // 添加新标记
  const filteredDrones = selectedDrone.value === 'all' ? drones.value : drones.value.filter(drone => drone.id === selectedDrone.value)

  filteredDrones.forEach(drone => {
    // 模拟无人机位置坐标
    const locationMap: Record<string, [number, number]> = {
      '北京': [116.397428, 39.90923],
      '上海': [121.473701, 31.230416],
      '广州': [113.264385, 23.129111],
      '深圳': [114.057868, 22.543099],
      '杭州': [120.15507, 30.274085]
    }

    const position = locationMap[drone.location] || [116.397428, 39.90923]

    // 创建标记
    const marker = new AMap.Marker({
      position: position,
      title: drone.name,
      anchor: 'bottom-center'
    })

    // 添加标记到地图
    marker.setMap(map)
    markers.push(marker)

    // 添加点击事件
    marker.on('click', () => {
      selectedDrone.value = drone.id
      selectedDroneInfo.value = drone
    })
  })

  // 如果只显示一个无人机，将地图中心移动到该无人机位置
  if (filteredDrones.length === 1) {
    const drone = filteredDrones[0]
    const locationMap: Record<string, [number, number]> = {
      '北京': [116.397428, 39.90923],
      '上海': [121.473701, 31.230416],
      '广州': [113.264385, 23.129111],
      '深圳': [114.057868, 22.543099],
      '杭州': [120.15507, 30.274085]
    }
    const position = locationMap[drone.location] || [116.397428, 39.90923]
    map.setCenter(position)
  }
}

// 获取无人机图标
const getDroneIcon = (status: string): string => {
  // 使用更可靠的图标 URL
  switch (status) {
    case 'online':
      return 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png'
    case 'flying':
      return 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-red.png'
    case 'offline':
      return 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-grey.png'
    default:
      return 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png'
  }
}

// 页面加载时初始化地图
onMounted(() => {
  initMap()
})
</script>

<style scoped>
.map3d-container {
  width: 100%;
}

.map3d-card {
  width: 100%;
}

.map3d-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 24px;
}

.map3d-controls {
  display: flex;
  align-items: center;
}

.map3d-content {
  display: flex;
  height: 700px;
  gap: 24px;
}

.map3d {
  flex: 1;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map3d-sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.status-card,
.drone-card,
.route-card {
  width: 100%;
}

.status-item,
.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.status-label,
.info-label {
  color: #666;
}

.status-value,
.info-value {
  font-weight: 500;
}

.status-value.online,
.info-value.online {
  color: #52c41a;
}

.status-value.flying,
.info-value.flying {
  color: #faad14;
}

.status-value.offline,
.info-value.offline {
  color: #f5222d;
}

@media (max-width: 1200px) {
  .map3d-content {
    flex-direction: column;
  }

  .map3d-sidebar {
    width: 100%;
    flex-direction: row;
  }

  .status-card,
  .drone-card,
  .route-card {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .map3d-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .map3d-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .map3d-controls select,
  .map3d-controls button {
    width: 100%;
    margin-right: 0 !important;
  }

  .map3d-sidebar {
    flex-direction: column;
  }
}
</style>
