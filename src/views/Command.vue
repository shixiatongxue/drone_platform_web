<template>
  <div class="command-container">
    <a-card title="多路指挥矩阵" :bordered="false" class="command-card">
      <div class="command-header">
        <a-select v-model:value="selectedMode" style="width: 120px; margin-right: 16px;">
          <a-select-option value="4">4路模式</a-select-option>
          <a-select-option value="9">9路模式</a-select-option>
        </a-select>
        <a-button type="primary" style="margin-right: 16px;">
          <PlayCircleOutlined /> 开始直播
        </a-button>
        <a-button type="default" style="margin-right: 16px;">
          <PauseCircleOutlined /> 暂停直播
        </a-button>
        <a-button type="default">
          <StopOutlined /> 停止直播
        </a-button>
      </div>
      <div class="video-grid" :class="{ 'grid-4': selectedMode === '4', 'grid-9': selectedMode === '9' }">
        <div 
          v-for="i in videoCount" 
          :key="i" 
          class="video-item"
          :class="{ 'active': selectedVideo === i }"
          @click="selectVideo(i)"
        >
          <div class="video-header">
            <span class="video-title">无人机 {{ i }}</span>
            <div class="video-controls">
              <AudioOutlined class="control-icon" />
              <VideoCameraOutlined class="control-icon" />
              <FullscreenOutlined class="control-icon" />
            </div>
          </div>
          <div class="video-content">
            <div class="video-placeholder">
              <VideoCameraOutlined style="font-size: 48px; color: #999;" />
              <p>视频流 {{ i }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="control-panel" v-if="selectedVideo">
        <a-card title="云台控制" :bordered="false" class="control-card">
          <div class="joystick-container">
            <div class="joystick">
              <div class="joystick-stick"></div>
            </div>
            <div class="joystick-labels">
              <span>上</span>
              <span>左</span>
              <span>右</span>
              <span>下</span>
            </div>
          </div>
          <div class="control-buttons">
            <a-button type="primary" style="margin-right: 16px;">
              <AudioOutlined /> 喊话
            </a-button>
            <a-button type="default" style="margin-right: 16px;">
              <EnvironmentOutlined /> 打点标注
            </a-button>
            <a-button type="default">
              <SettingOutlined /> 相机设置
            </a-button>
          </div>
          <div class="camera-settings">
            <a-slider v-model:value="zoom" :min="1" :max="10" style="width: 200px; margin-right: 16px;">
              <template #tooltip>{{ zoom }}x</template>
            </a-slider>
            <span>缩放: {{ zoom }}x</span>
          </div>
        </a-card>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PlayCircleOutlined, PauseCircleOutlined, StopOutlined, AudioOutlined, VideoCameraOutlined, FullscreenOutlined, EnvironmentOutlined, SettingOutlined } from '@ant-design/icons-vue'

const selectedMode = ref('4')
const selectedVideo = ref(1)
const zoom = ref(1)

const videoCount = computed(() => {
  return selectedMode.value === '4' ? 4 : 9
})

const selectVideo = (index: number) => {
  selectedVideo.value = index
}
</script>

<style scoped>
.command-container {
  width: 100%;
}

.command-card {
  width: 100%;
}

.command-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.video-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.grid-4 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
}

.grid-9 {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}

.video-item {
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
}

.video-item:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.video-item.active {
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.video-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e8e8e8;
}

.video-title {
  font-weight: 500;
  font-size: 14px;
}

.video-controls {
  display: flex;
  gap: 8px;
}

.control-icon {
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.control-icon:hover {
  color: #1890ff;
}

.video-content {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.video-placeholder p {
  margin-top: 8px;
  font-size: 14px;
}

.control-panel {
  margin-top: 24px;
}

.control-card {
  width: 100%;
}

.joystick-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.joystick {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: #f5f5f5;
  position: relative;
  margin: 0 24px;
}

.joystick-stick {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #1890ff;
  position: absolute;
  top: 40px;
  left: 40px;
  cursor: pointer;
}

.joystick-labels {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.joystick-labels span {
  font-size: 12px;
  color: #666;
}

.control-buttons {
  display: flex;
  margin-bottom: 24px;
}

.camera-settings {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .grid-4,
  .grid-9 {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(auto, 1fr);
  }

  .control-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .control-buttons button {
    margin-right: 0 !important;
  }
}
</style>