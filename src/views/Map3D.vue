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
import { droneAPI, Drone } from '../services/api'
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
const saveRoute = () => {
  if (waypoints.value.length < 2) {
    alert('请至少添加两个航点')
    return
  }

  console.log('保存航线:', waypoints.value)
  alert('航线保存成功')
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
  1: { base: [116.397428, 39.90923], direction: Math.random() * 360, speed: 10 + Math.random() * 5 },
  2: { base: [121.473701, 31.230416], direction: Math.random() * 360, speed: 10 + Math.random() * 5 },
  3: { base: [113.264385, 23.129111], direction: Math.random() * 360, speed: 10 + Math.random() * 5 },
  4: { base: [114.057868, 22.543099], direction: Math.random() * 360, speed: 10 + Math.random() * 5 },
  5: { base: [120.15507, 30.274085], direction: Math.random() * 360, speed: 10 + Math.random() * 5 }
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
        // 为每个无人机设置不同的初始位置
        const locationMap: Record<string, [number, number]> = {
          '北京': [116.397428, 39.90923],
          '上海': [121.473701, 31.230416],
          '广州': [113.264385, 23.129111],
          '深圳': [114.057868, 22.543099],
          '杭州': [120.15507, 30.274085]
        }
        const base = locationMap[drone.location] || [116.397428, 39.90923]
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
  // 停止追踪
  stopTracking()
  
  if (map) {
    // 清除所有标记
    markers.forEach(marker => marker.remove())
    routeMarkers.forEach(marker => marker.remove())
    
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
