<template>
  <div class="control-matrix-container">
    <div class="control-matrix-header">
      <h2>指挥矩阵</h2>
      <div class="header-actions">
        <a-button type="primary" @click="addVideoWindow">添加视频窗口</a-button>
        <a-button @click="clearAllWindows">清空所有窗口</a-button>
      </div>
    </div>
    
    <div class="control-matrix-content">
      <!-- 左侧无人机列表 -->
      <div class="drone-list">
        <h3>无人机列表</h3>
        <div class="drone-item" v-for="drone in drones" :key="drone.id" @click="selectDrone(drone)">
          <div class="drone-info">
            <span class="drone-name">{{ drone.name }}</span>
            <span class="drone-status" :class="drone.status">{{ drone.status }}</span>
          </div>
          <div class="drone-actions">
            <a-button type="link" size="small" @click.stop="startCameraForDrone(drone)">
              {{ getCameraStatus(drone.id) }}
            </a-button>
            <a-button type="link" size="small" @click.stop="viewDroneRoutes(drone)">
              查看航线
            </a-button>
          </div>
        </div>
      </div>
      
      <!-- 右侧视频矩阵 -->
      <div class="video-matrix">
        <h3>视频矩阵</h3>
        <div class="matrix-grid" :style="gridStyle">
          <div class="video-window" v-for="(window, index) in videoWindows" :key="window.id">
            <div class="video-header">
              <span class="window-title">{{ window.title }}</span>
              <div class="window-controls">
                <a-button type="text" size="small" @click="toggleCamera(index)" :disabled="!window.stream">
                  {{ window.isPlaying ? '暂停' : '播放' }}
                </a-button>
                <a-button type="text" size="small" @click="captureScreenshot(index)" :disabled="!window.stream">
                  截图
                </a-button>
                <a-button type="text" size="small" @click="toggleAiEvents(index)">
                  {{ window.showAiEvents ? '隐藏AI识别' : '显示AI识别' }}
                </a-button>
                <a-button type="text" size="small" danger @click="closeVideoWindow(index)">
                  关闭
                </a-button>
              </div>
            </div>
            <div class="video-content">
              <video :ref="el => setVideoRef(el, window.id)" autoplay playsinline muted></video>
              <div class="video-placeholder" v-if="!window.stream">
                <p>点击开始直播</p>
                <a-button type="primary" @click="startCamera(index)">开始直播</a-button>
              </div>
            </div>
            <div class="video-overlay" v-if="window.stream">
              <div class="overlay-info">
                <span>无人机: {{ window.droneName }}</span>
                <span>状态: {{ window.isPlaying ? '直播中' : '已暂停' }}</span>
              </div>
            </div>
            
            <!-- AI识别内容卡片 -->
            <div class="ai-events-container" v-if="window.showAiEvents && window.aiEvents.length > 0">
              <div class="ai-events-header">
                <span>AI识别内容</span>
                <span class="ai-events-count">{{ window.aiEvents.length }} 条</span>
              </div>
              <div class="ai-events-list">
                <div class="ai-event-card" v-for="event in window.aiEvents" :key="event.id">
                  <div class="ai-event-header">
                    <span class="ai-event-type">{{ event.eventType }}</span>
                    <span class="ai-event-time">{{ event.eventTime }}</span>
                  </div>
                  <div class="ai-event-content">
                    <p class="ai-event-description">{{ event.description }}</p>
                    <div class="ai-event-footer">
                      <span class="ai-event-status" :class="event.status">{{ event.status }}</span>
                      <a-button type="text" size="small" @click="viewAiEventDetails(event)">查看详情</a-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="video-window empty" v-if="videoWindows.length === 0">
            <div class="empty-state">
              <p>暂无视频窗口</p>
              <p>点击左侧无人机开始直播</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 航线信息模态框 -->
    <a-modal
      v-model:visible="routeModalVisible"
      title="航线信息"
      @cancel="routeModalVisible = false"
    >
      <div v-if="selectedRoute" class="route-info">
        <a-descriptions bordered>
          <a-descriptions-item label="航线ID">{{ selectedRoute.id }}</a-descriptions-item>
          <a-descriptions-item label="航线名称">{{ selectedRoute.name }}</a-descriptions-item>
          <a-descriptions-item label="描述">{{ selectedRoute.description }}</a-descriptions-item>
          <a-descriptions-item label="无人机">
            {{ selectedRoute ? (drones.find(d => d.id === selectedRoute.droneId)?.name || selectedRoute.droneId) : '未知' }}
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ selectedRoute.createdAt }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ selectedRoute.updatedAt }}</a-descriptions-item>
        </a-descriptions>
        <div style="margin-top: 20px">
          <h4>航点信息</h4>
          <pre>{{ selectedRoute.waypoints }}</pre>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { droneAPI, routeAPI, Drone, Route } from '../services/api'

// 无人机数据
const drones = ref<Drone[]>([])

// 航线数据
const routes = ref<Route[]>([])
const selectedRoute = ref<Route | null>(null)
const routeModalVisible = ref(false)

// AI识别内容接口
interface AIEvent {
  id: number
  eventType: string
  eventTime: string
  location: string
  description: string
  evidenceUrl: string
  status: string
}

// 视频窗口数据
interface VideoWindow {
  id: number
  title: string
  droneId: number | null
  droneName: string
  stream: MediaStream | null
  isPlaying: boolean
  aiEvents: AIEvent[]
  showAiEvents: boolean
}

const videoWindows = ref<VideoWindow[]>([])
const videoElements = ref<Record<number, HTMLVideoElement>>({})
const nextWindowId = ref(1)

// 网格样式
const gridStyle = computed(() => {
  const count = videoWindows.value.length
  if (count === 0) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' }
  if (count === 1) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' }
  if (count === 2) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' }
  if (count <= 4) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }
  if (count <= 6) return { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr' }
  return { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'repeat(auto-fill, minmax(300px, 1fr))' }
})

// 设置视频元素引用
const setVideoRef = (el: HTMLVideoElement | null, windowId: number) => {
  if (windowId) {
    if (el) {
      videoElements.value[windowId] = el
    } else {
      delete videoElements.value[windowId]
    }
  }
}

// 加载无人机数据
const loadDrones = async () => {
  try {
    drones.value = await droneAPI.getDrones()
  } catch (error) {
    console.error('Failed to load drones:', error)
  }
}

// 加载航线数据
const loadRoutes = async () => {
  try {
    routes.value = await routeAPI.getRoutes()
  } catch (error) {
    console.error('Failed to load routes:', error)
  }
}

// 选择无人机
const selectDrone = (drone: Drone) => {
  console.log('Selected drone:', drone)
  // 可以在这里实现地图高亮等功能
}

// 查看无人机航线信息
const viewDroneRoutes = (drone: Drone) => {
  // 过滤该无人机的航线
  const droneRoutes = routes.value.filter(route => route.droneId === drone.id)
  if (droneRoutes.length > 0) {
    selectedRoute.value = droneRoutes[0] // 显示第一条航线
    routeModalVisible.value = true
  } else {
    alert('该无人机暂无航线信息')
  }
}

// 截图功能
const captureScreenshot = async (index: number) => {
  const window = videoWindows.value[index]
  const videoElement = videoElements.value[window.id]
  if (!videoElement) return
  
  try {
    // 创建 canvas 元素
    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    
    // 绘制视频帧到 canvas
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
      
      // 转换为图片
      canvas.toBlob(async (blob) => {
        if (blob) {
          // 生成文件名
          const timestamp = new Date().getTime()
          const filename = `screenshot_${timestamp}.png`
          
          // 创建 FormData 并添加文件
          const formData = new FormData()
          formData.append('file', blob, filename)
          formData.append('title', `截图 - ${window.droneName}`)
          formData.append('description', `从 ${window.droneName} 直播中截图`)
          formData.append('droneId', window.droneId?.toString() || '0')
          formData.append('captureTime', new Date().toISOString())
          
          try {
            // 上传到服务器
            const response = await fetch('/api/photos/upload', {
              method: 'POST',
              body: formData
            })
            
            if (response.ok) {
              // 同时下载到本地
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = filename
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
              
              alert('截图成功并已保存到照片管理')
            } else {
              // 如果上传失败，至少下载到本地
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = filename
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
              
              alert('截图成功但保存到照片管理失败')
            }
          } catch (error) {
            console.error('上传截图失败:', error)
            // 如果上传失败，至少下载到本地
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            
            alert('截图成功但保存到照片管理失败')
          }
        }
      })
    }
  } catch (error) {
    console.error('截图失败:', error)
    alert('截图失败: ' + error.message)
  }
}

// 获取摄像头状态
const getCameraStatus = (droneId: number) => {
  const window = videoWindows.value.find(w => w.droneId === droneId)
  if (window) {
    return window.isPlaying ? '直播中' : '已暂停'
  }
  return '开始直播'
}

// 为无人机开始摄像头
const startCameraForDrone = async (drone: Drone) => {
  // 检查是否已有该无人机的视频窗口
  const existingWindow = videoWindows.value.find(w => w.droneId === drone.id)
  if (existingWindow) {
    // 切换播放状态
    toggleCamera(videoWindows.value.indexOf(existingWindow))
    return
  }
  
  // 创建新的视频窗口
  const newWindow: VideoWindow = {
    id: nextWindowId.value++,
    title: `${drone.name} - 摄像头`,
    droneId: drone.id,
    droneName: drone.name,
    stream: null,
    isPlaying: false,
    aiEvents: [],
    showAiEvents: true
  }
  videoWindows.value.push(newWindow)
  
  // 延迟启动摄像头，确保DOM已渲染
  const windowIndex = videoWindows.value.length - 1
  setTimeout(() => {
    startCamera(windowIndex)
  }, 100)
}

// 开始摄像头
const startCamera = async (index: number) => {
  try {
    // 请求摄像头权限
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    
    // 更新视频窗口数据
    videoWindows.value[index].stream = stream
    videoWindows.value[index].isPlaying = true
    
    // 设置视频源
    const windowId = videoWindows.value[index].id
    
    // 尝试设置视频源，如果视频元素不存在，则等待一段时间后再尝试
    const setVideoSource = () => {
      if (videoElements.value[windowId]) {
        videoElements.value[windowId].srcObject = stream
      } else {
        // 等待100毫秒后再尝试
        setTimeout(setVideoSource, 100)
      }
    }
    
    setVideoSource()
  } catch (error) {
    console.error('Error accessing camera:', error)
    alert('无法访问摄像头，请检查权限设置')
  }
}

// 切换摄像头播放状态
const toggleCamera = (index: number) => {
  const window = videoWindows.value[index]
  if (!window.stream) return
  
  if (window.isPlaying) {
    // 暂停视频
    if (videoElements.value[window.id]) {
      videoElements.value[window.id].pause()
    }
  } else {
    // 播放视频
    if (videoElements.value[window.id]) {
      videoElements.value[window.id].play()
    }
  }
  
  window.isPlaying = !window.isPlaying
}

// 切换AI识别内容显示
const toggleAiEvents = (index: number) => {
  videoWindows.value[index].showAiEvents = !videoWindows.value[index].showAiEvents
}

// 查看AI识别内容详情
const viewAiEventDetails = (event: AIEvent) => {
  console.log('View AI event details:', event)
  // 这里可以实现查看详情的逻辑，比如显示一个模态框
  alert(`事件类型: ${event.eventType}\n描述: ${event.description}\n状态: ${event.status}`)
}

// 关闭视频窗口
const closeVideoWindow = (index: number) => {
  const window = videoWindows.value[index]
  if (window.stream) {
    // 停止摄像头
    window.stream.getTracks().forEach(track => track.stop())
  }
  
  // 从视频元素对象中删除对应的元素
  delete videoElements.value[window.id]
  
  // 从数组中移除
  videoWindows.value.splice(index, 1)
}

// 添加视频窗口
const addVideoWindow = () => {
  const newWindow: VideoWindow = {
    id: nextWindowId.value++,
    title: `视频窗口 ${nextWindowId.value - 1}`,
    droneId: null,
    droneName: '未绑定',
    stream: null,
    isPlaying: false,
    aiEvents: [],
    showAiEvents: true
  }
  videoWindows.value.push(newWindow)
}

// 清空所有窗口
const clearAllWindows = () => {
  // 停止所有摄像头
  videoWindows.value.forEach(window => {
    if (window.stream) {
      window.stream.getTracks().forEach(track => track.stop())
    }
  })
  
  // 清空窗口列表
  videoWindows.value = []
  // 同时清空视频元素对象
  videoElements.value = {}
}

// 组件挂载时加载数据
onMounted(() => {
  loadDrones()
  loadRoutes()
})

// 组件卸载时清理
onUnmounted(() => {
  // 停止所有摄像头
  videoWindows.value.forEach(window => {
    if (window.stream) {
      window.stream.getTracks().forEach(track => track.stop())
    }
  })
})
</script>

<style scoped>
.control-matrix-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.control-matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.control-matrix-header h2 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.control-matrix-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
}

.drone-list {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  height: fit-content;
}

.drone-list h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.drone-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.drone-item:hover {
  background-color: #f5f5f5;
}

.drone-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.drone-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.drone-name {
  font-weight: 500;
  color: #333;
}

.drone-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  text-align: center;
  width: fit-content;
}

.drone-status.available {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.drone-status.busy {
  background-color: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.drone-status.maintenance {
  background-color: #fff1f0;
  color: #f5222d;
  border: 1px solid #ffccc7;
}

.video-matrix {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
  min-height: 600px;
}

.video-matrix h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.matrix-grid {
  display: grid;
  gap: 16px;
  min-height: 500px;
}

.video-window {
  position: relative;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16/9;
}

.video-window.empty {
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  text-align: center;
  color: #999;
}

.empty-state p {
  margin: 8px 0;
}

.video-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  z-index: 10;
}

.window-title {
  font-size: 14px;
  font-weight: 500;
}

.window-controls {
  display: flex;
  gap: 8px;
}

.window-controls .ant-btn-text {
  color: #1890ff;
}

.window-controls .ant-btn-text:hover {
  color: #40a9ff;
}

.window-controls .ant-btn-text[disabled] {
  color: #bfbfbf;
}

.video-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-content video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-placeholder {
  text-align: center;
  color: #999;
  padding: 20px;
}

.video-placeholder p {
  margin: 0 0 16px 0;
}

.video-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  z-index: 10;
}

.overlay-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

/* AI识别内容样式 */
.ai-events-container {
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.ai-events-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: 500;
}

.ai-events-count {
  font-size: 12px;
  color: #1890ff;
}

.ai-events-list {
  padding: 8px;
}

.ai-event-card {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.ai-event-card:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.ai-event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.ai-event-type {
  font-weight: 500;
  font-size: 14px;
}

.ai-event-time {
  font-size: 12px;
  color: #999;
}

.ai-event-content {
  font-size: 12px;
}

.ai-event-description {
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.ai-event-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.ai-event-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  text-align: center;
  width: fit-content;
}

.ai-event-status.processed {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.ai-event-status.pending {
  background-color: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.ai-event-status.failed {
  background-color: #fff1f0;
  color: #f5222d;
  border: 1px solid #ffccc7;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .control-matrix-content {
    grid-template-columns: 1fr;
  }
  
  .drone-list {
    order: 2;
  }
  
  .video-matrix {
    order: 1;
  }
}

@media (max-width: 768px) {
  .matrix-grid {
    grid-template-columns: 1fr !important;
    grid-template-rows: repeat(auto-fill, minmax(200px, 1fr)) !important;
  }
  
  .ai-events-container {
    max-height: 150px;
  }
}
</style>