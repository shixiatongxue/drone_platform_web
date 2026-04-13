<template>
  <div class="routes-container">
    <h2>航线管理</h2>
    
    <!-- 切换标签 -->
    <a-tabs v-model:active-key="activeTab" style="margin-bottom: 20px">
      <a-tab-pane tab="航线管理" key="routes">
        <!-- 搜索和筛选 -->
        <div class="search-filter">
          <a-input v-model:value="searchKeyword" placeholder="搜索航线名称" style="width: 300px; margin-right: 10px" />
          <a-select v-model:value="selectedDroneId" placeholder="选择无人机" style="width: 200px; margin-right: 10px">
            <a-select-option value="">全部无人机</a-select-option>
            <a-select-option v-for="drone in drones" :key="drone.id" :value="drone.id">
              {{ drone.name }}
            </a-select-option>
          </a-select>
          <a-button type="primary" @click="refreshRoutes">刷新</a-button>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <a-button type="primary" @click="showCreateForm">新增航线</a-button>
        </div>

        <!-- 航线列表 -->
        <a-table :columns="columns" :data-source="filteredRoutes" row-key="id" style="margin-top: 20px">
          <template #action="{ record }">
            <a-button size="small" @click="showEditForm(record)">编辑</a-button>
            <a-button size="small" danger @click="deleteRoute(record.id)">删除</a-button>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane tab="重点巡防区域" key="patrolAreas">
        <!-- 搜索和筛选 -->
        <div class="search-filter">
          <a-input v-model:value="areaSearchKeyword" placeholder="搜索区域名称" style="width: 300px; margin-right: 10px" />
          <a-select v-model:value="selectedDistrict" placeholder="选择区域" style="width: 200px; margin-right: 10px">
            <a-select-option value="">全部区域</a-select-option>
            <a-select-option value="张店区">张店区</a-select-option>
            <a-select-option value="淄川区">淄川区</a-select-option>
            <a-select-option value="博山区">博山区</a-select-option>
            <a-select-option value="临淄区">临淄区</a-select-option>
            <a-select-option value="周村区">周村区</a-select-option>
            <a-select-option value="桓台区">桓台区</a-select-option>
            <a-select-option value="高青区">高青区</a-select-option>
            <a-select-option value="沂源区">沂源区</a-select-option>
          </a-select>
          <a-button type="primary" @click="refreshPatrolAreas">刷新</a-button>
        </div>

        <!-- 重点巡防区域列表 -->
        <a-table :columns="patrolAreaColumns" :data-source="filteredPatrolAreas" row-key="id" style="margin-top: 20px">
          <template #action="{ record }">
            <a-button size="small" @click="viewPatrolAreaDetail(record)">查看详情</a-button>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <a-form :model="form" :rules="rules" ref="formRef">
        <a-form-item label="航线名称" name="name">
          <a-input v-model:value="form.name" placeholder="请输入航线名称" />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="form.description" placeholder="请输入航线描述" />
        </a-form-item>
        <a-form-item label="无人机" name="droneId">
          <a-select v-model:value="form.droneId" placeholder="选择无人机">
            <a-select-option v-for="drone in drones" :key="drone.id" :value="drone.id">
              {{ drone.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="航点" name="waypoints">
          <a-textarea v-model:value="form.waypoints" placeholder="请输入航点数据（JSON格式）" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 重点巡防区域详情弹窗 -->
    <a-modal
      v-model:visible="patrolAreaDetailVisible"
      title="重点巡防区域详情"
      @cancel="handlePatrolAreaDetailCancel"
    >
      <div v-if="selectedPatrolArea" class="patrol-area-detail">
        <a-descriptions bordered>
          <a-descriptions-item label="区域ID">{{ selectedPatrolArea.id }}</a-descriptions-item>
          <a-descriptions-item label="区域名称">{{ selectedPatrolArea.name }}</a-descriptions-item>
          <a-descriptions-item label="区域描述">{{ selectedPatrolArea.description }}</a-descriptions-item>
          <a-descriptions-item label="所属区域">{{ selectedPatrolArea.district }}</a-descriptions-item>
          <a-descriptions-item label="重要程度">{{ selectedPatrolArea.importanceLevel }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ selectedPatrolArea.createdAt }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ selectedPatrolArea.updatedAt }}</a-descriptions-item>
        </a-descriptions>
        <div style="margin-top: 20px">
          <h4>边界坐标</h4>
          <pre>{{ selectedPatrolArea.boundary }}</pre>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { routeAPI, droneAPI, patrolAreaAPI, Route, Drone, PatrolArea } from '../services/api';
import type { FormInstance } from 'ant-design-vue';

// 数据
const routes = ref<Route[]>([]);
const drones = ref<Drone[]>([]);
const searchKeyword = ref('');
const selectedDroneId = ref<number | string>('');
const activeTab = ref('routes');

// 重点巡防区域相关
const patrolAreas = ref<PatrolArea[]>([]);
const areaSearchKeyword = ref('');
const selectedDistrict = ref<string>('');
const patrolAreaDetailVisible = ref(false);
const selectedPatrolArea = ref<PatrolArea | null>(null);

// 弹窗相关
const modalVisible = ref(false);
const modalTitle = ref('新增航线');
const formRef = ref<FormInstance>();
const form = ref({
  id: 0,
  name: '',
  description: '',
  waypoints: '',
  droneId: 0
});

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入航线名称', trigger: 'blur' }],
  droneId: [{ required: true, message: '请选择无人机', trigger: 'change' }],
  waypoints: [{ required: true, message: '请输入航点数据', trigger: 'blur' }]
};

// 表格列配置
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '航线名称', dataIndex: 'name', key: 'name' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { 
    title: '无人机', 
    dataIndex: 'droneId', 
    key: 'droneId',
    customRender: (text: number) => {
      console.log('Rendering drone for droneId:', text);
      console.log('Available drones:', drones.value);
      const drone = drones.value.find(d => d.id === text);
      console.log('Found drone:', drone);
      return drone ? drone.name : text;
    }
  },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'action', slots: { customRender: 'action' } }
];

// 重点巡防区域表格列配置
const patrolAreaColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '区域名称', dataIndex: 'name', key: 'name' },
  { title: '区域描述', dataIndex: 'description', key: 'description' },
  { title: '所属区域', dataIndex: 'district', key: 'district' },
  { title: '重要程度', dataIndex: 'importanceLevel', key: 'importanceLevel' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'action', slots: { customRender: 'action' } }
];

// 过滤后的航线列表
const filteredRoutes = computed(() => {
  return routes.value.filter(route => {
    const matchesKeyword = route.name.toLowerCase().includes(searchKeyword.value.toLowerCase());
    const matchesDrone = selectedDroneId.value ? route.droneId === selectedDroneId.value : true;
    return matchesKeyword && matchesDrone;
  });
});

// 过滤后的重点巡防区域列表
const filteredPatrolAreas = computed(() => {
  return patrolAreas.value.filter(area => {
    const matchesKeyword = area.name.toLowerCase().includes(areaSearchKeyword.value.toLowerCase());
    const matchesDistrict = selectedDistrict.value ? area.district === selectedDistrict.value : true;
    return matchesKeyword && matchesDistrict;
  });
});

// 生命周期
onMounted(async () => {
  await loadDrones();
  await loadRoutes();
  await loadPatrolAreas();
});

// 当无人机列表加载完成后，重新渲染表格
watch(drones, () => {
  // 触发表格重新渲染
  routes.value = [...routes.value];
}, { deep: true });

// 加载无人机列表
const loadDrones = async () => {
  try {
    drones.value = await droneAPI.getDrones();
    console.log('Drones loaded:', drones.value);
  } catch (error) {
    console.error('Failed to load drones:', error);
  }
};

// 加载航线列表
const loadRoutes = async () => {
  try {
    routes.value = await routeAPI.getRoutes();
  } catch (error) {
    console.error('Failed to load routes:', error);
  }
};

// 加载重点巡防区域
const loadPatrolAreas = async () => {
  try {
    const result = await patrolAreaAPI.getPatrolAreas();
    patrolAreas.value = result;
    console.log('Patrol areas loaded:', patrolAreas.value);
  } catch (error) {
    console.error('Failed to load patrol areas:', error);
  }
};

// 刷新航线列表
const refreshRoutes = () => {
  loadRoutes();
};

// 刷新重点巡防区域
const refreshPatrolAreas = () => {
  loadPatrolAreas();
};

// 显示新增表单
const showCreateForm = () => {
  form.value = {
    id: 0,
    name: '',
    description: '',
    waypoints: '',
    droneId: 0
  };
  modalTitle.value = '新增航线';
  modalVisible.value = true;
};

// 显示编辑表单
const showEditForm = (route: Route) => {
  form.value = { ...route };
  modalTitle.value = '编辑航线';
  modalVisible.value = true;
};

// 处理表单提交
const handleOk = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    
    if (form.value.id) {
      // 编辑
      await routeAPI.updateRoute(form.value.id, form.value);
    } else {
      // 新增
      await routeAPI.createRoute(form.value);
    }
    
    modalVisible.value = false;
    loadRoutes();
  } catch (error) {
    console.error('Failed to save route:', error);
  }
};

// 处理取消
const handleCancel = () => {
  modalVisible.value = false;
};

// 删除航线
const deleteRoute = async (id: number) => {
  try {
    await routeAPI.deleteRoute(id);
    loadRoutes();
  } catch (error) {
    console.error('Failed to delete route:', error);
  }
};

// 查看重点巡防区域详情
const viewPatrolAreaDetail = (area: any) => {
  selectedPatrolArea.value = area;
  patrolAreaDetailVisible.value = true;
};

// 处理重点巡防区域详情取消
const handlePatrolAreaDetailCancel = () => {
  patrolAreaDetailVisible.value = false;
  selectedPatrolArea.value = null;
};
</script>

<style scoped>
.routes-container {
  padding: 20px;
}

.search-filter {
  margin-bottom: 20px;
}

.action-buttons {
  margin-bottom: 20px;
}
</style>