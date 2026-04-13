<template>
  <div class="videos-container">
    <h2>视频管理</h2>
    
    <!-- 搜索和筛选 -->
    <div class="search-filter">
      <a-select v-model:value="selectedDroneId" placeholder="选择无人机" style="width: 200px; margin-right: 10px">
        <a-select-option value="">全部无人机</a-select-option>
        <a-select-option v-for="drone in drones" :key="drone.id" :value="drone.id">
          {{ drone.name }}
        </a-select-option>
      </a-select>
      <a-date-picker
        v-model:value="dateRange"
        type="range"
        placeholder="选择时间范围"
        style="width: 400px; margin-right: 10px"
      />
      <a-button type="primary" @click="searchVideos">查询</a-button>
      <a-button @click="resetFilters">重置</a-button>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <a-button type="primary" @click="showCreateForm">新增视频</a-button>
    </div>

    <!-- 视频列表 -->
    <a-table :columns="columns" :data-source="videos" row-key="id" style="margin-top: 20px">
      <template #action="{ record }">
        <a-button size="small" @click="showEditForm(record)">编辑</a-button>
        <a-button size="small" danger @click="deleteVideo(record.id)">删除</a-button>
      </template>
    </a-table>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <a-form :model="form" :rules="rules" ref="formRef">
        <a-form-item label="视频标题" name="title">
          <a-input v-model:value="form.title" placeholder="请输入视频标题" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="form.description" placeholder="请输入视频描述" />
        </a-form-item>
        <a-form-item label="文件路径" name="filePath">
          <a-input v-model:value="form.filePath" placeholder="请输入视频文件路径" />
        </a-form-item>
        <a-form-item label="时长（秒）" name="duration">
          <a-input-number v-model:value="form.duration" placeholder="请输入视频时长" />
        </a-form-item>
        <a-form-item label="无人机" name="droneId">
          <a-select v-model:value="form.droneId" placeholder="选择无人机">
            <a-option v-for="drone in drones" :key="drone.id" :value="drone.id">
              {{ drone.name }}
            </a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="录制开始时间" name="recordingStartTime">
          <a-date-picker
            v-model:value="form.recordingStartTime"
            show-time
            placeholder="选择录制开始时间"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="录制结束时间" name="recordingEndTime">
          <a-date-picker
            v-model:value="form.recordingEndTime"
            show-time
            placeholder="选择录制结束时间"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { videoAPI, droneAPI, Video, Drone } from '../services/api';
import type { FormInstance } from 'ant-design-vue';
import dayjs from 'dayjs';

// 数据
const videos = ref<Video[]>([]);
const drones = ref<Drone[]>([]);
const selectedDroneId = ref<number | string>('');
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

// 弹窗相关
const modalVisible = ref(false);
const modalTitle = ref('新增视频');
const formRef = ref<FormInstance>();
const form = ref({
  id: 0,
  title: '',
  description: '',
  filePath: '',
  duration: 0,
  droneId: 0,
  recordingStartTime: null as any,
  recordingEndTime: null as any
});

// 表单验证规则
const rules = {
  title: [{ required: true, message: '请输入视频标题', trigger: 'blur' }],
  filePath: [{ required: true, message: '请输入文件路径', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入视频时长', trigger: 'blur' }],
  droneId: [{ required: true, message: '请选择无人机', trigger: 'change' }],
  recordingStartTime: [{ required: true, message: '请选择录制开始时间', trigger: 'change' }],
  recordingEndTime: [{ required: true, message: '请选择录制结束时间', trigger: 'change' }]
};

// 表格列配置
const columns = [
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
  { title: '操作', key: 'action', slots: { customRender: 'action' } }
];

// 生命周期
onMounted(() => {
  loadDrones();
  loadVideos();
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

// 搜索视频
const searchVideos = async () => {
  try {
    if (selectedDroneId.value && dateRange.value) {
      const startTime = dateRange.value[0].toISOString();
      const endTime = dateRange.value[1].toISOString();
      videos.value = await videoAPI.getVideosByTimeRange(selectedDroneId.value as number, startTime, endTime);
    } else if (selectedDroneId.value) {
      videos.value = await videoAPI.getVideosByDroneId(selectedDroneId.value as number);
    } else {
      loadVideos();
    }
  } catch (error) {
    console.error('Failed to search videos:', error);
  }
};

// 重置筛选条件
const resetFilters = () => {
  selectedDroneId.value = '';
  dateRange.value = null;
  loadVideos();
};

// 显示新增表单
const showCreateForm = () => {
  form.value = {
    id: 0,
    title: '',
    description: '',
    filePath: '',
    duration: 0,
    droneId: 0,
    recordingStartTime: null,
    recordingEndTime: null
  };
  modalTitle.value = '新增视频';
  modalVisible.value = true;
};

// 显示编辑表单
const showEditForm = (video: Video) => {
  form.value = {
    ...video,
    recordingStartTime: video.recordingStartTime ? dayjs(video.recordingStartTime) : null,
    recordingEndTime: video.recordingEndTime ? dayjs(video.recordingEndTime) : null
  };
  modalTitle.value = '编辑视频';
  modalVisible.value = true;
};

// 处理表单提交
const handleOk = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    const formData = {
      ...form.value,
      recordingStartTime: form.value.recordingStartTime ? form.value.recordingStartTime.toISOString() : '',
      recordingEndTime: form.value.recordingEndTime ? form.value.recordingEndTime.toISOString() : ''
    };
    
    if (form.value.id) {
      // 编辑
      await videoAPI.updateVideo(form.value.id, formData);
    } else {
      // 新增
      await videoAPI.createVideo(formData);
    }
    
    modalVisible.value = false;
    loadVideos();
  } catch (error) {
    console.error('Failed to save video:', error);
  }
};

// 处理取消
const handleCancel = () => {
  modalVisible.value = false;
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
</script>

<style scoped>
.videos-container {
  padding: 20px;
}

.search-filter {
  margin-bottom: 20px;
}

.action-buttons {
  margin-bottom: 20px;
}
</style>