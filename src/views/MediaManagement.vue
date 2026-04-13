<template>
  <div class="media-management">
    <h2>媒体管理</h2>
    
    <!-- 切换标签 -->
    <a-tabs v-model:active-key="activeTab" style="margin-bottom: 20px">
      <a-tab-pane tab="视频管理" key="videos">
        <!-- 视频搜索和筛选 -->
        <div class="search-filter">
          <a-select v-model:value="videoSelectedDroneId" placeholder="选择无人机" style="width: 200px; margin-right: 10px">
            <a-select-option value="">全部无人机</a-select-option>
            <a-select-option v-for="drone in drones" :key="drone.id" :value="drone.id">
              {{ drone.name }}
            </a-select-option>
          </a-select>
          <a-date-picker
            v-model:value="videoDateRange"
            type="range"
            placeholder="选择时间范围"
            style="width: 400px; margin-right: 10px"
          />
          <a-button type="primary" @click="searchVideos">查询</a-button>
          <a-button @click="resetVideoFilters">重置</a-button>
        </div>

        <!-- 视频操作按钮 -->
        <div class="action-buttons">
          <a-button type="primary" @click="showVideoCreateForm">新增视频</a-button>
        </div>

        <!-- 视频列表 -->
        <a-table :columns="videoColumns" :data-source="videos" row-key="id" style="margin-top: 20px">
          <template #videoAction="{ record }">
            <a-button size="small" @click="showVideoEditForm(record)">编辑</a-button>
            <a-button size="small" danger @click="deleteVideo(record.id)">删除</a-button>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane tab="照片管理" key="photos">
        <!-- 照片搜索和筛选 -->
        <div class="search-filter">
          <a-select v-model:value="photoSelectedDroneId" placeholder="选择无人机" style="width: 200px; margin-right: 10px">
            <a-select-option value="">全部无人机</a-select-option>
            <a-select-option v-for="drone in drones" :key="drone.id" :value="drone.id">
              {{ drone.name }}
            </a-select-option>
          </a-select>
          <a-date-picker
            v-model:value="photoDateRange"
            type="range"
            placeholder="选择时间范围"
            style="width: 400px; margin-right: 10px"
          />
          <a-button type="primary" @click="searchPhotos">查询</a-button>
          <a-button @click="resetPhotoFilters">重置</a-button>
        </div>

        <!-- 照片操作按钮 -->
        <div class="action-buttons">
          <a-button type="primary" @click="showPhotoCreateForm">新增照片</a-button>
        </div>

        <!-- 照片列表 -->
        <a-table :columns="photoColumns" :data-source="photos" row-key="id" style="margin-top: 20px">
          <template #photoAction="{ record }">
            <a-button size="small" @click="showPhotoEditForm(record)">编辑</a-button>
            <a-button size="small" danger @click="deletePhoto(record.id)">删除</a-button>
          </template>
          <template #picture="{ record }">
            <a-image :src="record.filePath" width="100" height="100" />
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>

    <!-- 视频新增/编辑弹窗 -->
    <a-modal
      v-model:visible="videoModalVisible"
      :title="videoModalTitle"
      @ok="handleVideoOk"
      @cancel="handleVideoCancel"
    >
      <a-form :model="videoForm" :rules="videoRules" ref="videoFormRef">
        <a-form-item label="视频标题" name="title">
          <a-input v-model:value="videoForm.title" placeholder="请输入视频标题" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="videoForm.description" placeholder="请输入视频描述" />
        </a-form-item>
        <a-form-item label="文件路径" name="filePath">
          <a-input v-model:value="videoForm.filePath" placeholder="请输入视频文件路径" />
        </a-form-item>
        <a-form-item label="时长（秒）" name="duration">
          <a-input-number v-model:value="videoForm.duration" placeholder="请输入视频时长" />
        </a-form-item>
        <a-form-item label="无人机" name="droneId">
          <a-select v-model:value="videoForm.droneId" placeholder="选择无人机">
            <a-select-option v-for="drone in drones" :key="drone.id" :value="drone.id">
              {{ drone.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="录制开始时间" name="recordingStartTime">
          <a-date-picker
            v-model:value="videoForm.recordingStartTime"
            show-time
            placeholder="选择录制开始时间"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="录制结束时间" name="recordingEndTime">
          <a-date-picker
            v-model:value="videoForm.recordingEndTime"
            show-time
            placeholder="选择录制结束时间"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 照片新增/编辑弹窗 -->
    <a-modal
      v-model:visible="photoModalVisible"
      :title="photoModalTitle"
      @ok="handlePhotoOk"
      @cancel="handlePhotoCancel"
    >
      <a-form :model="photoForm" :rules="photoRules" ref="photoFormRef">
        <a-form-item label="照片标题" name="title">
          <a-input v-model:value="photoForm.title" placeholder="请输入照片标题" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="photoForm.description" placeholder="请输入照片描述" />
        </a-form-item>
        <a-form-item label="文件路径" name="filePath">
          <a-input v-model:value="photoForm.filePath" placeholder="请输入照片文件路径" />
        </a-form-item>
        <a-form-item label="无人机" name="droneId">
          <a-select v-model:value="photoForm.droneId" placeholder="选择无人机">
            <a-select-option v-for="drone in drones" :key="drone.id" :value="drone.id">
              {{ drone.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="拍摄时间" name="captureTime">
          <a-date-picker
            v-model:value="photoForm.captureTime"
            show-time
            placeholder="选择拍摄时间"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { videoAPI, photoAPI, droneAPI, Video, Photo, Drone } from '../services/api';
import type { FormInstance } from 'ant-design-vue';
import dayjs from 'dayjs';

// 数据
const drones = ref<Drone[]>([]);
const activeTab = ref('videos');

// 视频相关数据
const videos = ref<Video[]>([]);
const videoSelectedDroneId = ref<number | string>('');
const videoDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

// 视频弹窗相关
const videoModalVisible = ref(false);
const videoModalTitle = ref('新增视频');
const videoFormRef = ref<FormInstance>();
const videoForm = ref({
  id: 0,
  title: '',
  description: '',
  filePath: '',
  duration: 0,
  droneId: 0,
  recordingStartTime: null as any,
  recordingEndTime: null as any
});

// 视频表单验证规则
const videoRules = {
  title: [{ required: true, message: '请输入视频标题', trigger: 'blur' }],
  filePath: [{ required: true, message: '请输入文件路径', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入视频时长', trigger: 'blur' }],
  droneId: [{ required: true, message: '请选择无人机', trigger: 'change' }],
  recordingStartTime: [{ required: true, message: '请选择录制开始时间', trigger: 'change' }],
  recordingEndTime: [{ required: true, message: '请选择录制结束时间', trigger: 'change' }]
};

// 视频表格列配置
const videoColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '视频标题', dataIndex: 'title', key: 'title' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '文件路径', dataIndex: 'filePath', key: 'filePath' },
  { title: '时长（秒）', dataIndex: 'duration', key: 'duration' },
  { 
    title: '无人机', 
    dataIndex: 'droneId', 
    key: 'droneId',
    customRender: (text: number) => {
      const drone = drones.value.find(d => d.id === text);
      return drone ? drone.name : text;
    }
  },
  { title: '录制开始时间', dataIndex: 'recordingStartTime', key: 'recordingStartTime' },
  { title: '录制结束时间', dataIndex: 'recordingEndTime', key: 'recordingEndTime' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'action', slots: { customRender: 'videoAction' } }
];

// 照片相关数据
const photos = ref<Photo[]>([]);
const photoSelectedDroneId = ref<number | string>('');
const photoDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

// 照片弹窗相关
const photoModalVisible = ref(false);
const photoModalTitle = ref('新增照片');
const photoFormRef = ref<FormInstance>();
const photoForm = ref({
  id: 0,
  title: '',
  description: '',
  filePath: '',
  droneId: 0,
  captureTime: null as any
});

// 照片表单验证规则
const photoRules = {
  title: [{ required: true, message: '请输入照片标题', trigger: 'blur' }],
  filePath: [{ required: true, message: '请输入文件路径', trigger: 'blur' }],
  droneId: [{ required: true, message: '请选择无人机', trigger: 'change' }],
  captureTime: [{ required: true, message: '请选择拍摄时间', trigger: 'change' }]
};

// 照片表格列配置
const photoColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '照片标题', dataIndex: 'title', key: 'title' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '文件路径', dataIndex: 'filePath', key: 'filePath' },
  { title: '预览', key: 'picture', slots: { customRender: 'picture' } },
  { 
    title: '无人机', 
    dataIndex: 'droneId', 
    key: 'droneId',
    customRender: (text: number) => {
      const drone = drones.value.find(d => d.id === text);
      return drone ? drone.name : text;
    }
  },
  { title: '拍摄时间', dataIndex: 'captureTime', key: 'captureTime' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'action', slots: { customRender: 'photoAction' } }
];

// 生命周期
onMounted(() => {
  loadDrones();
  loadVideos();
  loadPhotos();
});

// 加载无人机列表
const loadDrones = async () => {
  try {
    drones.value = await droneAPI.getDrones();
  } catch (error) {
    console.error('Failed to load drones:', error);
  }
};

// 加载视频列表
const loadVideos = async () => {
  try {
    videos.value = await videoAPI.getVideos();
  } catch (error) {
    console.error('Failed to load videos:', error);
  }
};

// 加载照片列表
const loadPhotos = async () => {
  try {
    photos.value = await photoAPI.getPhotos();
  } catch (error) {
    console.error('Failed to load photos:', error);
  }
};

// 搜索视频
const searchVideos = async () => {
  try {
    if (videoSelectedDroneId.value && videoDateRange.value) {
      const startTime = videoDateRange.value[0].toISOString();
      const endTime = videoDateRange.value[1].toISOString();
      videos.value = await videoAPI.getVideosByTimeRange(videoSelectedDroneId.value as number, startTime, endTime);
    } else if (videoSelectedDroneId.value) {
      videos.value = await videoAPI.getVideosByDroneId(videoSelectedDroneId.value as number);
    } else {
      loadVideos();
    }
  } catch (error) {
    console.error('Failed to search videos:', error);
  }
};

// 重置视频筛选条件
const resetVideoFilters = () => {
  videoSelectedDroneId.value = '';
  videoDateRange.value = null;
  loadVideos();
};

// 搜索照片
const searchPhotos = async () => {
  try {
    if (photoSelectedDroneId.value && photoDateRange.value) {
      const startTime = photoDateRange.value[0].toISOString();
      const endTime = photoDateRange.value[1].toISOString();
      photos.value = await photoAPI.getPhotosByTimeRange(photoSelectedDroneId.value as number, startTime, endTime);
    } else if (photoSelectedDroneId.value) {
      photos.value = await photoAPI.getPhotosByDroneId(photoSelectedDroneId.value as number);
    } else {
      loadPhotos();
    }
  } catch (error) {
    console.error('Failed to search photos:', error);
  }
};

// 重置照片筛选条件
const resetPhotoFilters = () => {
  photoSelectedDroneId.value = '';
  photoDateRange.value = null;
  loadPhotos();
};

// 显示视频新增表单
const showVideoCreateForm = () => {
  videoForm.value = {
    id: 0,
    title: '',
    description: '',
    filePath: '',
    duration: 0,
    droneId: 0,
    recordingStartTime: null,
    recordingEndTime: null
  };
  videoModalTitle.value = '新增视频';
  videoModalVisible.value = true;
};

// 显示视频编辑表单
const showVideoEditForm = (video: Video) => {
  videoForm.value = {
    ...video,
    recordingStartTime: video.recordingStartTime ? dayjs(video.recordingStartTime) : null,
    recordingEndTime: video.recordingEndTime ? dayjs(video.recordingEndTime) : null
  };
  videoModalTitle.value = '编辑视频';
  videoModalVisible.value = true;
};

// 处理视频表单提交
const handleVideoOk = async () => {
  if (!videoFormRef.value) return;
  
  try {
    await videoFormRef.value.validate();
    
    const formData = {
      ...videoForm.value,
      recordingStartTime: videoForm.value.recordingStartTime ? videoForm.value.recordingStartTime.toISOString() : '',
      recordingEndTime: videoForm.value.recordingEndTime ? videoForm.value.recordingEndTime.toISOString() : ''
    };
    
    if (videoForm.value.id) {
      // 编辑
      await videoAPI.updateVideo(videoForm.value.id, formData);
    } else {
      // 新增
      await videoAPI.createVideo(formData);
    }
    
    videoModalVisible.value = false;
    loadVideos();
  } catch (error) {
    console.error('Failed to save video:', error);
  }
};

// 处理视频取消
const handleVideoCancel = () => {
  videoModalVisible.value = false;
};

// 删除视频
const deleteVideo = async (id: number) => {
  try {
    await videoAPI.deleteVideo(id);
    loadVideos();
  } catch (error) {
    console.error('Failed to delete video:', error);
  }
};

// 显示照片新增表单
const showPhotoCreateForm = () => {
  photoForm.value = {
    id: 0,
    title: '',
    description: '',
    filePath: '',
    droneId: 0,
    captureTime: null
  };
  photoModalTitle.value = '新增照片';
  photoModalVisible.value = true;
};

// 显示照片编辑表单
const showPhotoEditForm = (photo: Photo) => {
  photoForm.value = {
    ...photo,
    captureTime: photo.captureTime ? dayjs(photo.captureTime) : null
  };
  photoModalTitle.value = '编辑照片';
  photoModalVisible.value = true;
};

// 处理照片表单提交
const handlePhotoOk = async () => {
  if (!photoFormRef.value) return;
  
  try {
    await photoFormRef.value.validate();
    
    const formData = {
      ...photoForm.value,
      captureTime: photoForm.value.captureTime ? photoForm.value.captureTime.toISOString() : ''
    };
    
    if (photoForm.value.id) {
      // 编辑
      await photoAPI.updatePhoto(photoForm.value.id, formData);
    } else {
      // 新增
      await photoAPI.createPhoto(formData);
    }
    
    photoModalVisible.value = false;
    loadPhotos();
  } catch (error) {
    console.error('Failed to save photo:', error);
  }
};

// 处理照片取消
const handlePhotoCancel = () => {
  photoModalVisible.value = false;
};

// 删除照片
const deletePhoto = async (id: number) => {
  try {
    await photoAPI.deletePhoto(id);
    loadPhotos();
  } catch (error) {
    console.error('Failed to delete photo:', error);
  }
};
</script>

<style scoped>
.media-management {
  padding: 20px;
}

.search-filter {
  margin-bottom: 20px;
}

.action-buttons {
  margin-bottom: 20px;
}
</style>