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
          <a-button type="link" size="small" @click.stop="startCameraForDrone(drone)">
            {{ getCameraStatus(drone.id) }}
          </a-button>
        </div>
      </div>
      
      <!-- 右侧视频矩阵 -->
      <div class="video-matrix">
        <h3>视频矩阵</h3>
        <div class="matrix-grid" :style="gridStyle">
          <div class="video-window" v-for="(window, index) in videoWindows" :key="index">
            <div class="video-header">
              <span class="window-title">{{ window.title }}</span>
              <div class="window-controls">
                <a-button type="text" size="small" @click="toggleCamera(index)" :disabled="!window.stream">
                  {{ window.isPlaying ? '暂停' : '播放' }}
                </a-button>
                <a-button type="text" size="small" danger @click="closeVideoWindow(index)">
                  关闭
                </a-button>
              </div>
            </div>
            <div class="video-content">
              <video ref="videoElements" :ref="el => setVideoRef(el, index)" autoplay playsinline muted></video>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { droneAPI, Drone } from '../services/api'

// 无人机数据
const drones = ref<Drone[]>([])

// 视频窗口数据
interface VideoWindow {
  id: number
  title: string
  droneId: number | null
  droneName: string
  stream: MediaStream | null
  isPlaying: boolean
}

const videoWindows = ref<VideoWindow[]>([])
const videoElements = ref<HTMLVideoElement[]>([])
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
const setVideoRef = (el: HTMLVideoElement | null, index: number) => {
  if (el) {
    videoElements.value[index] = el
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

// 选择无人机
const selectDrone = (drone: Drone) => {
  console.log('Selected drone:', drone)
  // 可以在这里实现地图高亮等功能
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
    isPlaying: false
  }
  videoWindows.value.push(newWindow)
  
  // 延迟启动摄像头，确保DOM已渲染
  setTimeout(() => {
    startCamera(videoWindows.value.length - 1)
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
    if (videoElements.value[index]) {
      videoElements.value[index].srcObject = stream
    }
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
    if (videoElements.value[index]) {
      videoElements.value[index].pause()
    }
  } else {
    // 播放视频
    if (videoElements.value[index]) {
      videoElements.value[index].play()
    }
  }
  
  window.isPlaying = !window.isPlaying
}

// 关闭视频窗口
const closeVideoWindow = (index: number) => {
  const window = videoWindows.value[index]
  if (window.stream) {
    // 停止摄像头
    window.stream.getTracks().forEach(track => track.stop())
  }
  
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
    isPlaying: false
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
}

// 组件挂载时加载数据
onMounted(() => {
  loadDrones()
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
}
</style>