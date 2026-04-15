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
            <a-select-option value="tracking">轨迹追踪</a-select-option>
          </a-select>
          <a-button type="primary" style="margin-right: 16px;" @click="refreshData">
            <SyncOutlined /> 刷新数据
          </a-button>
          <a-button type="default" @click="toggleTerrain">
            <GlobalOutlined /> {{ terrainEnabled ? '关闭地形' : '开启地形' }}
          </a-button>
          <a-button type="default" style="margin-left: 16px;" @click="toggleTracking">
            <ScanOutlined /> {{ trackingEnabled ? '停止追踪' : '开始追踪' }}
          </a-button>
          <a-button type="primary" style="margin-left: 16px;" @click="startAIRecognition">
            <ScanOutlined /> AI识别
          </a-button>
        </div>
      </div>
      <div class="map3d-content">
        <div id="map3d" class="map3d"></div>
        <div class="map3d-sidebar">
          <a-card v-if="selectedDrone === 'all'" title="无人机状态" :bordered="false" class="status-card">
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
            <div class="status-item">
              <span class="status-label">追踪中:</span>
              <span class="status-value tracking">{{ trackingCount }}</span>
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
            <div class="info-item" v-if="dronePositions[selectedDroneInfo.id]">
              <span class="info-label">实时位置:</span>
              <span class="info-value">{{ formatPosition(dronePositions[selectedDroneInfo.id]) }}</span>
            </div>
            <div class="info-item" v-if="dronePositions[selectedDroneInfo.id]">
              <span class="info-label">高度:</span>
              <span class="info-value">{{ dronePositions[selectedDroneInfo.id].altitude }} 米</span>
            </div>
            <div class="info-item" v-if="dronePositions[selectedDroneInfo.id]">
              <span class="info-label">速度:</span>
              <span class="info-value">{{ dronePositions[selectedDroneInfo.id].speed }} m/s</span>
            </div>
          </a-card>
          <a-card title="航线规划" :bordered="false" class="route-card" v-if="mapMode === 'route'">
            <a-button type="primary" style="width: 100%; margin-bottom: 16px;" @click="startRoutePlanning">
              <EditOutlined /> {{ isRoutePlanning ? '结束规划' : '开始规划' }}
            </a-button>
            <a-button type="default" style="width: 100%; margin-bottom: 16px;" @click="clearRoute">
              <CloseOutlined /> 清除航线
            </a-button>
            <a-button type="default" style="width: 100%; margin-bottom: 16px;" @click="saveRoute">
              <SaveOutlined /> 保存航线
            </a-button>
            <a-button type="default" style="width: 100%; margin-bottom: 16px;" @click="downloadKMZ">
              <DownloadOutlined /> 下载KMZ文件
            </a-button>
            
            <div class="waypoints-list" v-if="waypoints.length > 0">
              <h4 style="margin-bottom: 12px;">航点列表</h4>
              <a-list item-layout="horizontal" size="small">
                <a-list-item v-for="(waypoint, index) in waypoints" :key="index">
                  <a-list-item-meta>
                    <div slot="title">
                      <span>航点 {{ index + 1 }}</span>
                      <a-button type="link" size="small" style="margin-left: 12px;" @click="editWaypoint(index)">
                        编辑
                      </a-button>
                      <a-button type="link" size="small" style="margin-left: 8px;" @click="deleteWaypoint(index)">
                        删除
                      </a-button>
                    </div>
                    <div slot="description" style="color: #000000;">
                      <div>高度: {{ waypoint.altitude }} 米</div>
                      <div>速度: {{ waypoint.speed }} m/s</div>
                      <div>悬停: {{ waypoint.hoverTime }} 秒</div>
                      <div>动作: {{ waypoint.action }}</div>
                    </div>
                  </a-list-item-meta>
                </a-list-item>
              </a-list>
            </div>
          </a-card>
          
          <!-- 航点参数设置模态框 -->
          <a-modal
            v-model:visible="waypointModalVisible"
            title="航点参数设置"
            @ok="saveWaypoint"
            @cancel="waypointModalVisible = false"
          >
            <a-form layout="vertical">
              <a-form-item label="高度 (米)">
                <a-input-number v-model:value="waypoints[selectedWaypointIndex || 0].altitude" min="0" max="1000" step="1" style="width: 100%;" />
              </a-form-item>
              <a-form-item label="速度 (m/s)">
                <a-input-number v-model:value="waypoints[selectedWaypointIndex || 0].speed" min="1" max="50" step="0.5" style="width: 100%;" />
              </a-form-item>
              <a-form-item label="悬停时长 (秒)">
                <a-input-number v-model:value="waypoints[selectedWaypointIndex || 0].hoverTime" min="0" max="300" step="1" style="width: 100%;" />
              </a-form-item>
              <a-form-item label="动作">
                <a-select v-model:value="waypoints[selectedWaypointIndex || 0].action" style="width: 100%;">
                  <a-select-option value="none">无</a-select-option>
                  <a-select-option value="photo">拍照</a-select-option>
                  <a-select-option value="video">录像</a-select-option>
                </a-select>
              </a-form-item>
            </a-form>
          </a-modal>
          <a-card title="轨迹追踪" :bordered="false" class="tracking-card" v-if="mapMode === 'tracking'">
            <div class="tracking-info">
              <div class="info-item">
                <span class="info-label">WebSocket状态:</span>
                <span :class="['info-value', wsStatus]">{{ wsStatusText }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">活跃连接:</span>
                <span class="info-value">{{ activeConnections }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">接收数据:</span>
                <span class="info-value">{{ receivedDataCount }}</span>
              </div>
            </div>
            <a-button type="default" style="width: 100%; margin-top: 16px;" @click="clearTrajectories">
              <DeleteOutlined /> 清除轨迹
            </a-button>
          </a-card>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { droneAPI, routeAPI, Drone, Route } from '../services/api'
import { SyncOutlined, GlobalOutlined, EditOutlined, CloseOutlined, SaveOutlined, DeleteOutlined, DownloadOutlined, ScanOutlined } from '@ant-design/icons-vue'

// 无人机数据
const drones = ref<Drone[]>([])
const selectedDrone = ref<number | 'all'>('all')
const selectedDroneInfo = ref<Drone | null>(null)
const mapMode = ref('normal')
const terrainEnabled = ref(false)

// 轨迹追踪相关状态
const trackingEnabled = ref(false)
const wsStatus = ref('disconnected')
const wsStatusText = ref('未连接')
const activeConnections = ref(0)
const receivedDataCount = ref(0)

// 航线规划相关状态
const isRoutePlanning = ref(false)

// 无人机位置和轨迹数据
const dronePositions = ref<Record<number, any>>({})
const droneTrajectories = ref<Record<number, any[]>>({})
const trajectoryPolylines = ref<Record<number, any>>({})

// 地图实例
let map: any = null
let markers: any[] = []
let routeMarkers: any[] = []
let routePolyline: any = null
let flagMarker: any = null

// 航点数据
const waypoints = ref<any[]>([])
const selectedWaypointIndex = ref<number | null>(null)
const waypointModalVisible = ref(false)

// WebSocket连接
let websocket: WebSocket | null = null

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

// 计算追踪中的无人机数量
const trackingCount = computed(() => {
  return Object.keys(dronePositions.value).length
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

// 开始/结束航线规划
const startRoutePlanning = () => {
  if (!map) return
  
  if (!isRoutePlanning.value) {
    // 开始规划，监听地图点击事件
    console.log('开始航线规划，添加地图点击事件监听器')
    map.on('click', addRouteWaypointHandler)
    isRoutePlanning.value = true
  } else {
    // 结束规划，移除地图点击事件
    console.log('结束航线规划，移除地图点击事件监听器')
    map.off('click', addRouteWaypointHandler)
    isRoutePlanning.value = false
  }
}

// 航点点击事件处理函数
const addRouteWaypointHandler = (e: any) => {
  console.log('地图点击事件触发:', e)
  const position = e.lnglat
  addRouteWaypoint(position)
}

// 添加航点
const addRouteWaypoint = (position: any) => {
  if (!map) return

  console.log('添加航点:', position)

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

  // 创建航点数据对象
  const waypoint = {
    lat: position.getLat(),
    lng: position.getLng(),
    altitude: 50, // 默认高度50米
    speed: 10, // 默认速度10m/s
    hoverTime: 0, // 默认悬停0秒
    action: 'none' // 默认无动作
  }
  waypoints.value.push(waypoint)

  console.log('航点添加成功，当前航点数量:', waypoints.value.length)

  // 添加点击事件，用于编辑航点
  marker.on('click', (e: any) => {
    e.stopPropagation() // 阻止事件冒泡
    const index = routeMarkers.indexOf(marker)
    editWaypoint(index)
  })

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

  // 清除航点数据
  waypoints.value = []
  selectedWaypointIndex.value = null

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

// 编辑航点
const editWaypoint = (index: number) => {
  selectedWaypointIndex.value = index
  waypointModalVisible.value = true
}

// 删除航点
const deleteWaypoint = (index: number) => {
  // 移除航点标记
  if (routeMarkers[index]) {
    routeMarkers[index].remove()
    routeMarkers.splice(index, 1)
  }
  
  // 移除航点数据
  waypoints.value.splice(index, 1)
  
  // 更新航线
  updateRoutePolyline()
}

// 保存航点
const saveWaypoint = () => {
  waypointModalVisible.value = false
  // 可以在这里添加额外的保存逻辑
}

// 保存航线
const saveRoute = async () => {
  if (waypoints.value.length < 2) {
    alert('请至少添加两个航点')
    return
  }

  try {
    if (selectedDrone.value === 'all' || !selectedDroneInfo.value) {
      alert('请选择一个无人机')
      return
    }

    // 创建航线数据
    const routeData = {
      name: `航线 ${new Date().toLocaleString()}`,
      description: `由无人机 ${selectedDroneInfo.value.name} 规划的航线`,
      waypoints: JSON.stringify(waypoints.value),
      droneId: selectedDroneInfo.value.id
    }

    // 保存航线到数据库
    const savedRoute = await routeAPI.createRoute(routeData)
    console.log('航线保存成功:', savedRoute)
    alert('航线保存成功')
  } catch (error) {
    console.error('保存航线失败:', error)
    alert('保存航线失败: ' + error.message)
  }
}

// 下载KMZ文件
const downloadKMZ = async () => {
  if (waypoints.value.length < 2) {
    alert('请至少添加两个航点')
    return
  }

  try {
    // 发送请求到后端生成KMZ文件
    const response = await fetch('http://localhost:8082/api/routes/kmz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(waypoints.value)
    })

    if (response.ok) {
      // 下载文件
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `route_${new Date().getTime()}.kmz`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      alert('KMZ文件下载成功')
    } else {
      const errorText = await response.text()
      console.error('KMZ文件生成失败:', errorText)
      alert('KMZ文件生成失败: ' + errorText)
    }
  } catch (error) {
    console.error('下载KMZ文件失败:', error)
    alert('下载KMZ文件失败: ' + error.message)
  }
}



// 切换追踪状态
const toggleTracking = () => {
  if (trackingEnabled.value) {
    // 停止追踪
    stopTracking()
  } else {
    // 开始追踪
    startTracking()
  }
}

// 开始追踪
const startTracking = () => {
  if (!map) {
    alert('地图尚未初始化')
    return
  }

  // 初始化WebSocket连接
  initWebSocket()
  trackingEnabled.value = true
}

// 停止追踪
const stopTracking = () => {
  // 关闭WebSocket连接
  if (websocket) {
    websocket.close()
    websocket = null
  }
  trackingEnabled.value = false
  wsStatus.value = 'disconnected'
  wsStatusText.value = '未连接'
}

// 初始化WebSocket连接
const initWebSocket = () => {
  try {
    // 建立WebSocket连接
    websocket = new WebSocket('ws://localhost:8082/api/ws/flight-tracking')
    
    // 连接打开时
    websocket.onopen = () => {
      console.log('WebSocket连接已打开')
      wsStatus.value = 'connected'
      wsStatusText.value = '已连接'
      // 启动模拟数据
      simulatePositionData()
    }
    
    // 接收消息时
    websocket.onmessage = (event) => {
      try {
        const positionData = JSON.parse(event.data)
        receivedDataCount.value++
        updateDroneTrajectory(positionData)
      } catch (error) {
        console.error('解析位置数据失败:', error)
      }
    }
    
    // 连接关闭时
    websocket.onclose = () => {
      console.log('WebSocket连接已关闭')
      wsStatus.value = 'disconnected'
      wsStatusText.value = '未连接'
    }
    
    // 连接错误时
    websocket.onerror = (error) => {
      console.error('WebSocket连接错误:', error)
      wsStatus.value = 'error'
      wsStatusText.value = '连接错误'
      // 即使连接失败，也启动模拟数据
      simulatePositionData()
    }
  } catch (error) {
    console.error('初始化WebSocket连接失败:', error)
    wsStatus.value = 'error'
    wsStatusText.value = '连接失败'
    // 即使初始化失败，也启动模拟数据
    simulatePositionData()
  }
}

// 更新无人机轨迹
const updateDroneTrajectory = (positionData: any) => {
  if (!map) return
  
  const { droneId, longitude, latitude, altitude, speed, heading } = positionData
  
  // 存储位置数据
  dronePositions.value[droneId] = {
    longitude,
    latitude,
    altitude,
    speed,
    heading
  }
  
  // 初始化轨迹数据
  if (!droneTrajectories.value[droneId]) {
    droneTrajectories.value[droneId] = []
  }
  
  // 添加新位置点
  const position = [longitude, latitude]
  droneTrajectories.value[droneId].push(position)
  
  // 限制轨迹点数量，避免性能问题
  if (droneTrajectories.value[droneId].length > 100) {
    droneTrajectories.value[droneId] = droneTrajectories.value[droneId].slice(-100)
  }
  
  // 更新轨迹线
  updateTrajectoryPolyline(droneId)
  
  // 更新无人机标记位置
  updateDroneMarker(droneId, position)
}

// 更新轨迹线
const updateTrajectoryPolyline = (droneId: number) => {
  if (!map || !droneTrajectories.value[droneId] || droneTrajectories.value[droneId].length < 2) return
  
  // 清除旧轨迹线
  if (trajectoryPolylines.value[droneId]) {
    trajectoryPolylines.value[droneId].remove()
  }
  
  // 创建新轨迹线
  const polyline = new AMap.Polyline({
    path: droneTrajectories.value[droneId],
    strokeColor: getTrajectoryColor(droneId),
    strokeWeight: 3,
    strokeOpacity: 0.8,
    lineJoin: 'round'
  })
  
  // 添加轨迹线到地图
  polyline.setMap(map)
  trajectoryPolylines.value[droneId] = polyline
}

// 更新无人机标记位置
const updateDroneMarker = (droneId: number, position: any) => {
  if (!map) return
  
  // 查找现有的标记
  const existingMarker = markers.find(marker => marker.droneId === droneId)
  
  if (existingMarker) {
    // 更新标记位置
    existingMarker.setPosition(position)
  } else {
    // 创建新标记
    const marker = new AMap.Marker({
      position: position,
      title: `无人机 ${droneId}`,
      anchor: 'bottom-center',
      icon: new AMap.Icon({
        size: new AMap.Size(30, 30),
        image: getDroneIcon('flying'),
        imageSize: new AMap.Size(30, 30)
      })
    })
    
    // 添加标记到地图
    marker.setMap(map)
    marker.droneId = droneId
    markers.push(marker)
    
    // 添加点击事件
    marker.on('click', () => {
      selectedDrone.value = droneId
      selectedDroneInfo.value = drones.value.find(drone => drone.id === droneId) || null
    })
  }
}

// 获取轨迹颜色
const getTrajectoryColor = (droneId: number): string => {
  // 返回绿色，用于轨迹追踪
  return '#00ff00'
}

// 格式化位置数据
const formatPosition = (position: any): string => {
  if (!position) return '未知'
  return `${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`
}

// 清除轨迹
const clearTrajectories = () => {
  // 清除所有轨迹线
  Object.values(trajectoryPolylines.value).forEach(polyline => polyline.remove())
  trajectoryPolylines.value = {}
  
  // 清除轨迹数据
  droneTrajectories.value = {}
}



// 无人机位置状态
const droneStates = ref({
  1: { base: [118.0597, 36.8007], direction: Math.random() * 360, speed: 10 + Math.random() * 5 }, // 张店区
  2: { base: [117.9597, 36.7007], direction: Math.random() * 360, speed: 10 + Math.random() * 5 }, // 淄川区
  3: { base: [117.8597, 36.6007], direction: Math.random() * 360, speed: 10 + Math.random() * 5 }, // 博山区
  4: { base: [118.3597, 36.8507], direction: Math.random() * 360, speed: 10 + Math.random() * 5 }, // 临淄区
  5: { base: [117.8597, 36.7507], direction: Math.random() * 360, speed: 10 + Math.random() * 5 }  // 周村区
})

// 无人机航点跟踪状态
const droneWaypointStates = ref({
  1: { currentWaypoint: 0, progress: 0 },
  2: { currentWaypoint: 0, progress: 0 },
  3: { currentWaypoint: 0, progress: 0 },
  4: { currentWaypoint: 0, progress: 0 },
  5: { currentWaypoint: 0, progress: 0 }
})

// 模拟位置数据（用于测试）
const simulatePositionData = () => {
  // 检查是否有航线规划数据
  if (waypoints.value.length > 0) {
    // 使用航线规划的航点生成模拟数据
    drones.value.forEach(drone => {
      const droneId = drone.id
      // 初始化航点跟踪状态
      if (!droneWaypointStates.value[droneId]) {
        droneWaypointStates.value[droneId] = { currentWaypoint: 0, progress: 0 }
      }
      
      const state = droneWaypointStates.value[droneId]
      
      // 检查是否还有航点
      if (state.currentWaypoint < waypoints.value.length) {
        const currentWaypoint = waypoints.value[state.currentWaypoint]
        const nextWaypoint = state.currentWaypoint + 1 < waypoints.value.length ? waypoints.value[state.currentWaypoint + 1] : currentWaypoint
        
        // 计算当前位置
        const progress = Math.min(1, state.progress + 0.15) // 每2秒前进15%
        const currentLng = currentWaypoint.lng + (nextWaypoint.lng - currentWaypoint.lng) * progress
        const currentLat = currentWaypoint.lat + (nextWaypoint.lat - currentWaypoint.lat) * progress
        
        // 计算方向
        const dx = nextWaypoint.lng - currentWaypoint.lng
        const dy = nextWaypoint.lat - currentWaypoint.lat
        const heading = Math.atan2(dy, dx) * 180 / Math.PI
        
        // 生成位置数据
        const positionData = {
          droneId: droneId,
          timestamp: new Date().toISOString(),
          longitude: currentLng,
          latitude: currentLat,
          altitude: currentWaypoint.altitude,
          speed: currentWaypoint.speed,
          heading: heading
        }
        
        // 更新轨迹
        updateDroneTrajectory(positionData)
        
        // 更新进度
        state.progress += 0.15
        
        // 如果到达当前航点，移动到下一个航点
        if (state.progress >= 1) {
          state.currentWaypoint = (state.currentWaypoint + 1) % waypoints.value.length
          state.progress = 0
        }
      }
    })
  } else {
    // 如果没有航线规划数据，使用原来的随机模拟数据
    drones.value.forEach(drone => {
      const droneId = drone.id
      // 初始化无人机状态
      if (!droneStates.value[droneId]) {
        // 为每个无人机设置不同的初始位置 - 淄博市各区
        const locationMap: Record<string, [number, number]> = {
          '淄博市张店区': [118.0597, 36.8007],
          '淄博市淄川区': [117.9597, 36.7007],
          '淄博市博山区': [117.8597, 36.6007],
          '淄博市临淄区': [118.3597, 36.8507],
          '淄博市周村区': [117.8597, 36.7507]
        }
        const base = locationMap[drone.location] || [118.0597, 36.8007]
        droneStates.value[droneId] = { base: base, direction: Math.random() * 360, speed: 10 + Math.random() * 5 }
      }
      
      const state = droneStates.value[droneId]
      
      // 计算新位置
      const distance = state.speed * 0.0003 // 每2秒移动的距离（度）
      const newLng = state.base[0] + distance * Math.cos(state.direction * Math.PI / 180)
      const newLat = state.base[1] + distance * Math.sin(state.direction * Math.PI / 180)
      
      // 更新基础位置
      state.base = [newLng, newLat]
      
      // 随机调整方向和速度
      state.direction += (Math.random() - 0.5) * 20 // 最多改变20度
      state.speed = Math.max(5, Math.min(20, state.speed + (Math.random() - 0.5) * 2)) // 速度在5-20之间
      
      const positionData = {
        droneId: droneId,
        timestamp: new Date().toISOString(),
        longitude: newLng,
        latitude: newLat,
        altitude: 50 + Math.sin(Date.now() / 1000) * 20, // 高度上下波动
        speed: state.speed,
        heading: state.direction
      }
      
      // 更新轨迹
      updateDroneTrajectory(positionData)
    })
  }
  
  // 每2秒更新一次
  if (trackingEnabled.value) {
    setTimeout(simulatePositionData, 2000)
  }
}

// 监听选中的无人机变化
watch(selectedDrone, (newValue) => {
  console.log('选中的无人机:', newValue)
  if (newValue === 'all') {
    selectedDroneInfo.value = null
    updateMapMarkers()
    // 清除小旗子标记
    if (flagMarker) {
      console.log('清除小旗子标记')
      flagMarker.remove()
      flagMarker = null
    }
  } else {
    selectedDroneInfo.value = drones.value.find(drone => drone.id === newValue) || null
    console.log('选中的无人机信息:', selectedDroneInfo.value)
    updateMapMarkers()
    // 定位到选中的无人机
    if (selectedDroneInfo.value && map) {
      // 模拟无人机位置坐标 - 淄博市各区
      const locationMap: Record<string, [number, number]> = {
        '淄博市张店区': [118.0597, 36.8007],
        '淄博市淄川区': [117.9597, 36.7007],
        '淄博市博山区': [117.8597, 36.6007],
        '淄博市临淄区': [118.3597, 36.8507],
        '淄博市周村区': [117.8597, 36.7507]
      }
      console.log('无人机位置:', selectedDroneInfo.value.location)
      console.log('位置映射:', locationMap[selectedDroneInfo.value.location])
      const position = locationMap[selectedDroneInfo.value.location] || [118.0597, 36.8007]
      console.log('最终位置:', position)
      // 设置地图中心为无人机位置
      map.setCenter(position)
      // 调整地图缩放级别
      map.setZoom(15)
      
      // 清除旧的小旗子标记
      if (flagMarker) {
        console.log('清除旧的小旗子标记')
        flagMarker.remove()
        flagMarker = null
      }
      
      console.log('创建小旗子标记，位置:', position, '无人机:', selectedDroneInfo.value.name)
      // 创建小旗子标记
      flagMarker = new AMap.Marker({
        position: position,
        icon: new AMap.Icon({
          size: new AMap.Size(40, 40),
          image: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
          imageSize: new AMap.Size(40, 40)
        }),
        title: `无人机 ${selectedDroneInfo.value.name} 位置`,
        anchor: 'bottom-center'
      })
      
      // 添加小旗子标记到地图
      flagMarker.setMap(map)
      console.log('小旗子标记已添加到地图')
      console.log('小旗子标记:', flagMarker)
    } else {
      console.log('selectedDroneInfo.value 或 map 为 null')
      console.log('selectedDroneInfo.value:', selectedDroneInfo.value)
      console.log('map:', map)
    }
  }
})

// 加载淄博市边界
const loadZiboBoundary = () => {
  if (!map) return

  // 淄博市边界坐标（更准确的实际边界）
  const ziboBoundary = [
    [117.7000, 37.1500], // 高青县西北部
    [118.0000, 37.1500], // 桓台县北部
    [118.4000, 37.1000], // 临淄区东北部
    [118.4000, 36.8500], // 临淄区南部
    [118.2000, 36.7000], // 张店区东部
    [118.1000, 36.5000], // 博山区东南部
    [117.9000, 36.3000], // 沂源县南部
    [117.7000, 36.4000], // 沂源县西部
    [117.6000, 36.6000], // 博山区西部
    [117.6000, 36.8000], // 周村区西部
    [117.7000, 37.0000], // 高青县西南部
    [117.7000, 37.1500]  // 回到起点
  ]

  // 绘制淄博市边界
  const ziboPolyline = new AMap.Polyline({
    path: ziboBoundary,
    strokeColor: '#ff0000',
    strokeWeight: 4,
    strokeOpacity: 0.8,
    lineJoin: 'round'
  })
  ziboPolyline.setMap(map)

  // 绘制各个区的边界（更准确的实际边界）
  const districts = {
    '张店区': [
      [117.9500, 36.7500], // 西部边界
      [118.1500, 36.7500], // 东部边界
      [118.1500, 36.8500], // 北部边界
      [117.9500, 36.8500], // 南部边界
      [117.9500, 36.7500]  // 回到起点
    ],
    '淄川区': [
      [117.8500, 36.6500], // 西部边界
      [118.0000, 36.6500], // 东部边界
      [118.0000, 36.7500], // 北部边界
      [117.8500, 36.7500], // 南部边界
      [117.8500, 36.6500]  // 回到起点
    ],
    '博山区': [
      [117.7500, 36.5000], // 西部边界
      [117.9500, 36.5000], // 东部边界
      [117.9500, 36.6500], // 北部边界
      [117.7500, 36.6500], // 南部边界
      [117.7500, 36.5000]  // 回到起点
    ],
    '临淄区': [
      [118.2000, 36.7500], // 西部边界
      [118.4500, 36.7500], // 东部边界
      [118.4500, 37.0500], // 北部边界
      [118.2000, 37.0500], // 南部边界
      [118.2000, 36.7500]  // 回到起点
    ],
    '周村区': [
      [117.7000, 36.7000], // 西部边界
      [117.9000, 36.7000], // 东部边界
      [117.9000, 36.8000], // 北部边界
      [117.7000, 36.8000], // 南部边界
      [117.7000, 36.7000]  // 回到起点
    ],
    '桓台区': [
      [117.9000, 36.8500], // 西部边界
      [118.1500, 36.8500], // 东部边界
      [118.1500, 37.1000], // 北部边界
      [117.9000, 37.1000], // 南部边界
      [117.9000, 36.8500]  // 回到起点
    ],
    '高青区': [
      [117.6000, 37.0000], // 西部边界
      [117.9000, 37.0000], // 东部边界
      [117.9000, 37.1500], // 北部边界
      [117.6000, 37.1500], // 南部边界
      [117.6000, 37.0000]  // 回到起点
    ],
    '沂源区': [
      [117.7000, 36.1500], // 西部边界
      [118.1000, 36.1500], // 东部边界
      [118.1000, 36.4500], // 北部边界
      [117.7000, 36.4500], // 南部边界
      [117.7000, 36.1500]  // 回到起点
    ]
  }

  // 为每个区绘制边界
  Object.entries(districts).forEach(([name, boundary]) => {
    const districtPolyline = new AMap.Polyline({
      path: boundary,
      strokeColor: '#0000ff',
      strokeWeight: 2,
      strokeOpacity: 0.6,
      lineJoin: 'round'
    })
    districtPolyline.setMap(map)

    // 计算区域中心点
    const center = {
      lng: boundary.reduce((sum, point) => sum + point[0], 0) / boundary.length,
      lat: boundary.reduce((sum, point) => sum + point[1], 0) / boundary.length
    }

    // 添加区名称标记
    const marker = new AMap.Marker({
      position: [center.lng, center.lat],
      content: `<div style="background-color: white; padding: 4px; border-radius: 4px; font-size: 12px;">${name}</div>`,
      anchor: 'bottom-center'
    })
    marker.setMap(map)
  })
}

// 初始化地图
const initMap = () => {
  // 加载高德地图API
  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = 'https://webapi.amap.com/maps?v=2.0&key=50dd5fa2e6ca9a17cdcbf727f2568928&plugin=AMap.3DMap,AMap.Terrain,AMap.Polyline,AMap.Marker,AMap.ToolBar,AMap.Scale,AMap.OverviewMap'
  script.onload = () => {
    // 初始化3D地图 - 淄博市坐标
    map = new AMap.Map('map3d', {
      zoom: 10,
      center: [118.0597, 36.8007], // 淄博市张店区坐标
      viewMode: '3D', // 开启3D模式
      pitch: 60, // 俯仰角
      rotation: 0, // 旋转角
      zooms: [10, 18] // 限制缩放范围，聚焦淄博市
    })

    // 添加控件
    try {
      map.addControl(new AMap.ToolBar())
      map.addControl(new AMap.Scale())
      // 移除 OverviewMap 控件，因为它不是一个有效的构造函数
    } catch (error) {
      console.error('Failed to add controls:', error)
    }

    // 加载淄博市边界
    loadZiboBoundary()

    // 加载无人机数据
    loadDrones()
  }
  document.head.appendChild(script)
}

// 清理地图实例
const cleanupMap = () => {
  // 停止追踪
  stopTracking()
  
  if (map) {
    // 清除所有标记
    markers.forEach(marker => marker.remove())
    routeMarkers.forEach(marker => marker.remove())
    
    // 清除小旗子标记
    if (flagMarker) {
      flagMarker.remove()
      flagMarker = null
    }
    
    // 清除航线
    if (routePolyline) {
      routePolyline.remove()
    }
    
    // 清除轨迹线
    Object.values(trajectoryPolylines.value).forEach(polyline => polyline.remove())
    
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
    // 模拟无人机位置坐标 - 淄博市各区
    const locationMap: Record<string, [number, number]> = {
      '淄博市张店区': [118.0597, 36.8007],
      '淄博市淄川区': [117.9597, 36.7007],
      '淄博市博山区': [117.8597, 36.6007],
      '淄博市临淄区': [118.3597, 36.8507],
      '淄博市周村区': [117.8597, 36.7507],
      '北京': [116.397428, 39.90923],
      '上海': [121.473701, 31.230416],
      '广州': [113.264385, 23.129111],
      '深圳': [114.057868, 22.543099],
      '杭州': [120.15507, 30.274085]
    }

    const position = locationMap[drone.location] || [118.0597, 36.8007]

    // 创建标记
    const marker = new AMap.Marker({
      position: position,
      title: drone.name,
      anchor: 'bottom-center',
      icon: new AMap.Icon({
        size: new AMap.Size(30, 30),
        image: getDroneIcon(drone.status),
        imageSize: new AMap.Size(30, 30)
      })
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
    // 模拟无人机位置坐标 - 淄博市各区
    const locationMap: Record<string, [number, number]> = {
      '淄博市张店区': [118.0597, 36.8007],
      '淄博市淄川区': [117.9597, 36.7007],
      '淄博市博山区': [117.8597, 36.6007],
      '淄博市临淄区': [118.3597, 36.8507],
      '淄博市周村区': [117.8597, 36.7507],
      '北京': [116.397428, 39.90923],
      '上海': [121.473701, 31.230416],
      '广州': [113.264385, 23.129111],
      '深圳': [114.057868, 22.543099],
      '杭州': [120.15507, 30.274085]
    }
    const position = locationMap[drone.location] || [118.0597, 36.8007]
    map.setCenter(position)
  }

  // 确保小旗子标记仍然存在
  if (selectedDrone.value !== 'all' && selectedDroneInfo.value && map) {
    // 模拟无人机位置坐标 - 淄博市各区
    const locationMap: Record<string, [number, number]> = {
      '淄博市张店区': [118.0597, 36.8007],
      '淄博市淄川区': [117.9597, 36.7007],
      '淄博市博山区': [117.8597, 36.6007],
      '淄博市临淄区': [118.3597, 36.8507],
      '淄博市周村区': [117.8597, 36.7507],
      '北京': [116.397428, 39.90923],
      '上海': [121.473701, 31.230416],
      '广州': [113.264385, 23.129111],
      '深圳': [114.057868, 22.543099],
      '杭州': [120.15507, 30.274085]
    }
    const position = locationMap[selectedDroneInfo.value.location] || [118.0597, 36.8007]
    
    // 清除旧的小旗子标记
    if (flagMarker) {
      flagMarker.remove()
      flagMarker = null
    }
    
    // 创建小旗子标记
    flagMarker = new AMap.Marker({
      position: position,
      icon: new AMap.Icon({
        size: new AMap.Size(40, 40),
        image: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
        imageSize: new AMap.Size(40, 40)
      }),
      title: `无人机 ${selectedDroneInfo.value.name} 位置`,
      anchor: 'bottom-center'
    })
    
    // 添加小旗子标记到地图
    flagMarker.setMap(map)
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
      // 使用可用的默认图标，避免灰色图标资源失效导致标记不显示
      return 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png'
    default:
      return 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png'
  }
}

// 开始AI识别
const startAIRecognition = () => {
  if (selectedDrone.value === 'all' || !selectedDroneInfo.value) {
    alert('请选择一个无人机进行AI识别')
    return
  }

  // 模拟AI识别过程
  alert('开始AI识别...')

  // 模拟AI识别结果
  setTimeout(() => {
    // 随机生成AI识别结果
    const recognitionResults = [
      { type: '人员密集', level: '高', location: selectedDroneInfo.value.location, confidence: 0.92 },
      { type: '火灾感应', level: '低', location: selectedDroneInfo.value.location, confidence: 0.35 },
      { type: '违法垂钓', level: '无', location: selectedDroneInfo.value.location, confidence: 0.12 }
    ]

    // 显示识别结果
    let resultMessage = `无人机 ${selectedDroneInfo.value.name} AI识别结果：\n\n`
    recognitionResults.forEach(result => {
      resultMessage += `${result.type}: ${result.level} (置信度: ${(result.confidence * 100).toFixed(0)}%)\n`
    })

    alert(resultMessage)

    // 可以在这里添加更多逻辑，比如将识别结果保存到数据库
    console.log('AI识别结果:', recognitionResults)
  }, 2000)
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

.status-value.tracking,
.info-value.tracking {
  color: #1890ff;
}

.info-value.connected {
  color: #52c41a;
}

.info-value.disconnected {
  color: #f5222d;
}

.info-value.error {
  color: #faad14;
}

.tracking-card {
  width: 100%;
}

.tracking-info {
  margin-bottom: 16px;
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
