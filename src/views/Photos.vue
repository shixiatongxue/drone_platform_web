<template>
  <div class="photos-container">
    <h2>照片管理</h2>
    
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
      <a-button type="primary" @click="searchPhotos">查询</a-button>
      <a-button @click="resetFilters">重置</a-button>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <a-button type="primary" @click="showCreateForm">新增照片</a-button>
    </div>

    <!-- 照片列表 -->
    <a-table :columns="columns" :data-source="photos" row-key="id" style="margin-top: 20px">
      <template #action="{ record }">
        <a-button size="small" @click="showEditForm(record)">编辑</a-button>
        <a-button size="small" danger @click="deletePhoto(record.id)">删除</a-button>
      </template>
      <template #picture="{ record }">
        <a-image :src="record.filePath" width="100" height="100" />
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
        <a-form-item label="照片标题" name="title">
          <a-input v-model:value="form.title" placeholder="请输入照片标题" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="form.description" placeholder="请输入照片描述" />
        </a-form-item>
        <a-form-item label="文件路径" name="filePath">
          <a-input v-model:value="form.filePath" placeholder="请输入照片文件路径" />
        </a-form-item>
        <a-form-item label="无人机" name="droneId">
          <a-select v-model:value="form.droneId" placeholder="选择无人机">
            <a-select-option v-for="drone in drones" :key="drone.id" :value="drone.id">
              {{ drone.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="拍摄时间" name="captureTime">
          <a-date-picker
            v-model:value="form.captureTime"
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
import { photoAPI, droneAPI, Photo, Drone } from '../services/api';
import type { FormInstance } from 'ant-design-vue';
import dayjs from 'dayjs';

// 数据
const photos = ref<Photo[]>([]);
const drones = ref<Drone[]>([]);
const selectedDroneId = ref<number | string>('');
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

// 弹窗相关
const modalVisible = ref(false);
const modalTitle = ref('新增照片');
const formRef = ref<FormInstance>();
const form = ref({
  id: 0,
  title: '',
  description: '',
  filePath: '',
  droneId: 0,
  captureTime: null as any
});

// 表单验证规则
const rules = {
  title: [{ required: true, message: '请输入照片标题', trigger: 'blur' }],
  filePath: [{ required: true, message: '请输入文件路径', trigger: 'blur' }],
  droneId: [{ required: true, message: '请选择无人机', trigger: 'change' }],
  captureTime: [{ required: true, message: '请选择拍摄时间', trigger: 'change' }]
};

// 表格列配置
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '照片标题', dataIndex: 'title', key: 'title' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { 
    title: '文件路径', 
    dataIndex: 'filePath', 
    key: 'filePath',
    customRender: (text: string) => {
      // 将实际路径转换为以D:/drone/photo开头的路径
      if (text) {
        return text.replace('D:/project/drone_platform_backend/photos', 'D:/drone/photo');
      }
      return text;
    }
  },
  { title: '预览', key: 'picture', slots: { customRender: 'picture' } },
  { 
    title: '无人机', 
    dataIndex: 'droneName', 
    key: 'droneName'
  },
  { title: '拍摄时间', dataIndex: 'captureTime', key: 'captureTime' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'action', slots: { customRender: 'action' } }
];

// 生命周期
onMounted(() => {
  loadDrones();
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

// 加载照片列表
const loadPhotos = async () => {
  try {
    photos.value = await photoAPI.getPhotos();
  } catch (error) {
    console.error('Failed to load photos:', error);
  }
};

// 搜索照片
const searchPhotos = async () => {
  try {
    if (selectedDroneId.value && dateRange.value) {
      const startTime = dateRange.value[0].toISOString();
      const endTime = dateRange.value[1].toISOString();
      photos.value = await photoAPI.getPhotosByTimeRange(selectedDroneId.value as number, startTime, endTime);
    } else if (selectedDroneId.value) {
      photos.value = await photoAPI.getPhotosByDroneId(selectedDroneId.value as number);
    } else {
      loadPhotos();
    }
  } catch (error) {
    console.error('Failed to search photos:', error);
  }
};

// 重置筛选条件
const resetFilters = () => {
  selectedDroneId.value = '';
  dateRange.value = null;
  loadPhotos();
};

// 显示新增表单
const showCreateForm = () => {
  form.value = {
    id: 0,
    title: '',
    description: '',
    filePath: '',
    droneId: 0,
    captureTime: null
  };
  modalTitle.value = '新增照片';
  modalVisible.value = true;
};

// 显示编辑表单
const showEditForm = (photo: Photo) => {
  form.value = {
    ...photo,
    captureTime: photo.captureTime ? dayjs(photo.captureTime) : null
  };
  modalTitle.value = '编辑照片';
  modalVisible.value = true;
};

// 处理表单提交
const handleOk = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    const formData = {
      ...form.value,
      captureTime: form.value.captureTime ? form.value.captureTime.toISOString() : ''
    };
    
    if (form.value.id) {
      // 编辑
      await photoAPI.updatePhoto(form.value.id, formData);
    } else {
      // 新增
      await photoAPI.createPhoto(formData);
    }
    
    modalVisible.value = false;
    loadPhotos();
  } catch (error) {
    console.error('Failed to save photo:', error);
  }
};

// 处理取消
const handleCancel = () => {
  modalVisible.value = false;
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
.photos-container {
  padding: 20px;
}

.search-filter {
  margin-bottom: 20px;
}

.action-buttons {
  margin-bottom: 20px;
}
</style>