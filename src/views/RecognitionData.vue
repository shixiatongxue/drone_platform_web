<template>
  <div class="recognition-data">
    <h2>异常预警</h2>
    
    <!-- 切换标签 -->
    <a-tabs v-model:active-key="activeTab" style="margin-bottom: 20px">
      <a-tab-pane tab="异常事件" key="events">
        <!-- 搜索和筛选 -->
        <div class="search-filter">
          <a-select v-model:value="selectedDroneId" placeholder="选择无人机" style="width: 200px; margin-right: 10px">
            <a-select-option value="">全部无人机</a-select-option>
            <a-select-option v-for="drone in drones" :key="drone.id" :value="drone.id">
              {{ drone.name }}
            </a-select-option>
          </a-select>
          <a-select v-model:value="selectedEventType" placeholder="选择事件类型" style="width: 200px; margin-right: 10px">
            <a-select-option value="">全部类型</a-select-option>
            <a-select-option value="人员密集">人员密集</a-select-option>
            <a-select-option value="火灾感应">浓烟火灾</a-select-option>
            <a-select-option value="违法垂钓">违法垂钓</a-select-option>
          </a-select>
          <a-date-picker
            v-model:value="dateRange"
            type="range"
            placeholder="选择时间范围"
            style="width: 400px; margin-right: 10px"
          />
          <a-button type="primary" @click="searchEvents">查询</a-button>
          <a-button @click="resetFilters">重置</a-button>
        </div>

        <!-- 异常事件列表 -->
        <a-table :columns="eventColumns" :data-source="filteredEvents" row-key="id" style="margin-top: 20px">
          <template #action="{ record }">
            <a-button size="small" @click="viewEventDetail(record)">查看详情</a-button>
          </template>
          <template #evidence="{ record }">
            <a-button size="small" @click="viewEventEvidence(record)">查看照片</a-button>
          </template>
          <template #status="{ record }">
            <a-badge 
              status="error" 
              text="异常" 
            />
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane tab="重点巡防区域记录" key="patrolAreas">
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
          <a-date-picker
            v-model:value="areaDateRange"
            type="range"
            placeholder="选择时间范围"
            style="width: 400px; margin-right: 10px"
          />
          <a-button type="primary" @click="searchPatrolAreas">查询</a-button>
          <a-button @click="resetAreaFilters">重置</a-button>
        </div>

        <!-- 重点巡防区域记录列表 -->
        <a-table :columns="patrolAreaColumns" :data-source="patrolAreas" row-key="id" style="margin-top: 20px">
          <template #action="{ record }">
            <a-button size="small" @click="viewPatrolAreaDetail(record)">查看详情</a-button>
          </template>
          <template #status="{ record }">
            <a-badge 
              :status="isAreaNormal(record) ? 'success' : 'error'" 
              :text="isAreaNormal(record) ? '正常' : '异常'" 
            />
          </template>
          <template #evidence="{ record }">
            <a-button v-if="!isAreaNormal(record)" size="small" @click="viewAreaEvidence(record)">查看照片</a-button>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>

    <!-- 事件详情弹窗 -->
    <a-modal
      v-model:visible="eventDetailVisible"
      title="事件详情"
      @cancel="handleEventDetailCancel"
    >
      <div v-if="selectedEvent" class="event-detail">
        <a-descriptions bordered>
          <a-descriptions-item label="事件ID">{{ selectedEvent.id }}</a-descriptions-item>
          <a-descriptions-item label="无人机">{{ getDroneName(selectedEvent.droneId) }}</a-descriptions-item>
          <a-descriptions-item label="事件类型">{{ selectedEvent.eventDescription }}</a-descriptions-item>
          <a-descriptions-item label="事件时间">{{ selectedEvent.eventTime }}</a-descriptions-item>
          <a-descriptions-item label="事件地点">{{ formatLocation(selectedEvent.location) }}</a-descriptions-item>
          <a-descriptions-item label="事件描述">{{ selectedEvent.eventDescription }}</a-descriptions-item>
          <a-descriptions-item label="人员密集程度">{{ selectedEvent.crowdDensity || '未检测' }}</a-descriptions-item>
          <a-descriptions-item label="火灾风险">{{ selectedEvent.fireRisk || '未检测' }}</a-descriptions-item>
          <a-descriptions-item label="违法垂钓情况">{{ selectedEvent.fishingViolation || '未检测' }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-badge 
              :status="selectedEvent.status === '正常' ? 'success' : 'error'" 
              :text="selectedEvent.status" 
            />
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ selectedEvent.createdAt }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ selectedEvent.updatedAt }}</a-descriptions-item>
        </a-descriptions>
        <div style="margin-top: 20px">
          <h4>证据图片</h4>
          <a-image :src="selectedEvent.evidenceUrl" style="width: 100%" />
        </div>
      </div>
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
          <a-descriptions-item label="负责无人机">{{ getDroneName(selectedPatrolArea.droneId) }}</a-descriptions-item>
          <a-descriptions-item label="人员密集程度">{{ selectedPatrolArea.crowdDensity || '未检测' }}</a-descriptions-item>
          <a-descriptions-item label="火灾风险">{{ selectedPatrolArea.fireRisk || '未检测' }}</a-descriptions-item>
          <a-descriptions-item label="违法垂钓情况">{{ selectedPatrolArea.fishingViolation || '未检测' }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-badge 
              :status="isAreaNormal(selectedPatrolArea) ? 'success' : 'error'" 
              :text="isAreaNormal(selectedPatrolArea) ? '正常' : '异常'" 
            />
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ selectedPatrolArea.createdAt }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ selectedPatrolArea.updatedAt }}</a-descriptions-item>
        </a-descriptions>
        <div style="margin-top: 20px">
          <h4>边界坐标</h4>
          <pre>{{ selectedPatrolArea.boundary }}</pre>
        </div>
        <div v-if="!isAreaNormal(selectedPatrolArea) && selectedPatrolArea.evidenceUrl" style="margin-top: 20px">
          <h4>证据图片</h4>
          <a-image :src="selectedPatrolArea.evidenceUrl" style="width: 100%" />
        </div>
      </div>
    </a-modal>

    <!-- 区域证据图片弹窗 -->
    <a-modal
      v-model:visible="areaEvidenceVisible"
      title="区域证据图片"
      @cancel="handleAreaEvidenceCancel"
    >
      <div v-if="selectedAreaEvidence" class="area-evidence-detail">
        <a-image :src="selectedAreaEvidence" style="width: 100%" />
      </div>
    </a-modal>

    <!-- 事件证据图片弹窗 -->
    <a-modal
      v-model:visible="eventEvidenceVisible"
      title="事件证据图片"
      @cancel="handleEventEvidenceCancel"
    >
      <div v-if="selectedEventEvidence" class="event-evidence-detail">
        <a-image :src="selectedEventEvidence" style="width: 100%" />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import { droneAPI, aiEventsAPI, patrolAreaAPI, Drone, AIEvents, PatrolArea } from '../services/api';
import dayjs from 'dayjs';

// 数据
const drones = ref<Drone[]>([]);
const events = ref<AIEvents[]>([]);
const patrolAreas = ref<PatrolArea[]>([]);
const selectedDroneId = ref<number | string>('');
const selectedEventType = ref<string>('');
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
const areaSearchKeyword = ref('');
const selectedDistrict = ref<string>('');
const areaDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
const activeTab = ref('events');

// 计算属性：过滤异常事件
const filteredEvents = computed(() => {
  return patrolAreas.value.filter(area => {
    // 只显示异常事件
    return area.status === '异常';
  });
});

// 事件详情弹窗
const eventDetailVisible = ref(false);
const selectedEvent = ref<any>(null);

// 重点巡防区域详情弹窗
const patrolAreaDetailVisible = ref(false);
const selectedPatrolArea = ref<any>(null);

// 区域证据图片弹窗
const areaEvidenceVisible = ref(false);
const selectedAreaEvidence = ref<string>('');

// 事件证据图片弹窗
const eventEvidenceVisible = ref(false);
const selectedEventEvidence = ref<string>('');

// 表格列配置
const eventColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { 
    title: '无人机', 
    dataIndex: 'droneId', 
    key: 'droneId',
    customRender: (text: number) => {
      const drone = drones.value.find(d => d.id === text);
      return drone ? drone.name : text;
    }
  },
  { title: '事件类型', dataIndex: 'eventDescription', key: 'eventDescription' },
  { title: '事件时间', dataIndex: 'eventTime', key: 'eventTime' },
  { 
    title: '事件地点', 
    dataIndex: 'location', 
    key: 'location',
    customRender: (text: any) => {
      return formatLocation(text);
    }
  },
  { title: '事件描述', dataIndex: 'eventDescription', key: 'eventDescription' },
  { title: '状态', key: 'status', slots: { customRender: 'status' } },
  { title: '证据', key: 'evidence', slots: { customRender: 'evidence' } },
  { title: '操作', key: 'action', slots: { customRender: 'action' } }
];

// 重点巡防区域表格列配置
const patrolAreaColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { 
    title: '无人机', 
    dataIndex: 'droneId', 
    key: 'droneId',
    customRender: (text: number) => {
      const drone = drones.value.find(d => d.id === text);
      return drone ? drone.name : text;
    }
  },
  { title: '时间', dataIndex: 'eventTime', key: 'eventTime' },
  { 
    title: '地点', 
    dataIndex: 'location', 
    key: 'location',
    customRender: (text: any) => {
      return formatLocation(text);
    }
  },
  { title: '事件描述', dataIndex: 'eventDescription', key: 'eventDescription' },
  { title: '状态', key: 'status', slots: { customRender: 'status' } },
  { title: '证据', key: 'evidence', slots: { customRender: 'evidence' } },
  { title: '操作', key: 'action', slots: { customRender: 'action' } }
];

// 生命周期
onMounted(async () => {
  await loadDrones();
  await loadEvents();
  await loadPatrolAreas();
});

// 加载无人机列表
const loadDrones = async () => {
  try {
    drones.value = await droneAPI.getDrones();
  } catch (error) {
    console.error('Failed to load drones:', error);
  }
};

// 加载事件数据
const loadEvents = async () => {
  try {
    const result = await aiEventsAPI.getAIEvents();
    events.value = result;
    console.log('Events loaded:', events.value);
  } catch (error) {
    console.error('Failed to load events:', error);
  }
};

// 加载重点巡防区域数据
const loadPatrolAreas = async () => {
  try {
    const result = await patrolAreaAPI.getPatrolAreas();
    // 为每个重点巡防区域添加无人机ID和AI检测数据（临时解决方案）
    const areasWithData = result.map((area, index) => {
      const crowdDensity = ['低', '中等', '高'][Math.floor(Math.random() * 3)];
      const fireRisk = ['低', '中等', '高'][Math.floor(Math.random() * 3)];
      const fishingViolation = ['无', '低', '中等', '高'][Math.floor(Math.random() * 4)];
      // 为异常区域添加证据图片
      let evidenceUrl = '';
      let eventDescription = '一切正常';
      if (crowdDensity === '高' || fireRisk === '高' || fishingViolation === '高') {
        if (crowdDensity === '高') {
          evidenceUrl = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drone%20ai%20detection%20crowd%20people&image_size=square';
          eventDescription = '人员密集';
        } else if (fireRisk === '高') {
          evidenceUrl = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drone%20ai%20detection%20fire%20smoke&image_size=square';
          eventDescription = '浓烟火灾';
        } else if (fishingViolation === '高') {
          evidenceUrl = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drone%20ai%20detection%20fishing%20person&image_size=square';
          eventDescription = '违法垂钓';
        }
      }
      // 生成随机时间（最近24小时内）
      const randomTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
      return {
        ...area,
        droneId: (index % 5) + 1, // 分配无人机ID
        crowdDensity,
        fireRisk,
        fishingViolation,
        evidenceUrl,
        eventTime: randomTime.toISOString(), // 事件时间
        location: area.name, // 地点（使用区域名称）
        eventDescription, // 事件描述
        status: isAreaNormal({ crowdDensity, fireRisk, fishingViolation }) ? '正常' : '异常' // 状态
      };
    });
    patrolAreas.value = areasWithData;
    console.log('Patrol areas loaded:', patrolAreas.value);
  } catch (error) {
    console.error('Failed to load patrol areas:', error);
  }
};

// 搜索事件
const searchEvents = async () => {
  try {
    const result = await patrolAreaAPI.searchPatrolAreas(selectedEventType.value, '');
    // 为每个重点巡防区域添加无人机ID和AI检测数据
    const areasWithData = result.map((area, index) => {
      const crowdDensity = ['低', '中等', '高'][Math.floor(Math.random() * 3)];
      const fireRisk = ['低', '中等', '高'][Math.floor(Math.random() * 3)];
      const fishingViolation = ['无', '低', '中等', '高'][Math.floor(Math.random() * 4)];
      // 为异常区域添加证据图片
      let evidenceUrl = '';
      let eventDescription = '一切正常';
      if (crowdDensity === '高' || fireRisk === '高' || fishingViolation === '高') {
        if (crowdDensity === '高') {
          evidenceUrl = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drone%20ai%20detection%20crowd%20people&image_size=square';
          eventDescription = '人员密集';
        } else if (fireRisk === '高') {
          evidenceUrl = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drone%20ai%20detection%20fire%20smoke&image_size=square';
          eventDescription = '浓烟火灾';
        } else if (fishingViolation === '高') {
          evidenceUrl = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drone%20ai%20detection%20fishing%20person&image_size=square';
          eventDescription = '违法垂钓';
        }
      }
      // 生成随机时间（最近24小时内）
      const randomTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
      return {
        ...area,
        droneId: (index % 5) + 1, // 分配无人机ID
        crowdDensity,
        fireRisk,
        fishingViolation,
        evidenceUrl,
        eventTime: randomTime.toISOString(), // 事件时间
        location: area.name, // 地点（使用区域名称）
        eventDescription, // 事件描述
        status: isAreaNormal({ crowdDensity, fireRisk, fishingViolation }) ? '正常' : '异常' // 状态
      };
    });
    patrolAreas.value = areasWithData;
    console.log('Events searched:', patrolAreas.value);
  } catch (error) {
    console.error('Failed to search events:', error);
  }
};

// 重置筛选条件
const resetFilters = () => {
  selectedDroneId.value = '';
  selectedEventType.value = '';
  dateRange.value = null;
  loadPatrolAreas();
};

// 重置重点巡防区域筛选条件
const resetAreaFilters = () => {
  areaSearchKeyword.value = '';
  selectedDistrict.value = '';
  areaDateRange.value = null;
  loadPatrolAreas();
};

// 判断重点巡防区域是否正常
const isAreaNormal = (area: any): boolean => {
  // 如果人员密集程度为高，或者火灾风险为高，或者违法垂钓情况为高，则认为异常
  return !(area.crowdDensity === '高' || area.fireRisk === '高' || area.fishingViolation === '高');
};

// 查看区域证据图片
const viewAreaEvidence = (area: any) => {
  // 这里可以根据区域ID获取对应的证据图片
  // 暂时使用模拟数据
  selectedAreaEvidence.value = area.evidenceUrl || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drone%20ai%20detection%20${area.crowdDensity === '高' ? 'crowd' : area.fireRisk === '高' ? 'fire' : 'fishing'}&image_size=square`;
  areaEvidenceVisible.value = true;
};

// 关闭区域证据图片弹窗
const handleAreaEvidenceCancel = () => {
  areaEvidenceVisible.value = false;
  selectedAreaEvidence.value = '';
};

// 查看事件证据图片
const viewEventEvidence = (event: any) => {
  selectedEventEvidence.value = event.evidenceUrl || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drone%20ai%20detection%20${event.eventDescription === '人员密集' ? 'crowd' : event.eventDescription === '浓烟火灾' ? 'fire' : 'fishing'}&image_size=square`;
  eventEvidenceVisible.value = true;
};

// 关闭事件证据图片弹窗
const handleEventEvidenceCancel = () => {
  eventEvidenceVisible.value = false;
  selectedEventEvidence.value = '';
};

// 搜索重点巡防区域
const searchPatrolAreas = async () => {
  try {
    const result = await patrolAreaAPI.searchPatrolAreas(areaSearchKeyword.value, selectedDistrict.value);
    // 为每个重点巡防区域添加无人机ID和AI检测数据（临时解决方案）
    const areasWithData = result.map((area, index) => {
      const crowdDensity = ['低', '中等', '高'][Math.floor(Math.random() * 3)];
      const fireRisk = ['低', '中等', '高'][Math.floor(Math.random() * 3)];
      const fishingViolation = ['无', '低', '中等', '高'][Math.floor(Math.random() * 4)];
      // 为异常区域添加证据图片
      let evidenceUrl = '';
      let eventDescription = '一切正常';
      if (crowdDensity === '高' || fireRisk === '高' || fishingViolation === '高') {
        if (crowdDensity === '高') {
          evidenceUrl = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drone%20ai%20detection%20crowd%20people&image_size=square';
          eventDescription = '人员密集';
        } else if (fireRisk === '高') {
          evidenceUrl = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drone%20ai%20detection%20fire%20smoke&image_size=square';
          eventDescription = '浓烟火灾';
        } else if (fishingViolation === '高') {
          evidenceUrl = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drone%20ai%20detection%20fishing%20person&image_size=square';
          eventDescription = '违法垂钓';
        }
      }
      // 生成随机时间（最近24小时内）
      const randomTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
      return {
        ...area,
        droneId: (index % 5) + 1, // 分配无人机ID
        crowdDensity,
        fireRisk,
        fishingViolation,
        evidenceUrl,
        eventTime: randomTime.toISOString(), // 事件时间
        location: area.name, // 地点（使用区域名称）
        eventDescription, // 事件描述
        status: isAreaNormal({ crowdDensity, fireRisk, fishingViolation }) ? '正常' : '异常' // 状态
      };
    });
    patrolAreas.value = areasWithData;
    console.log('Patrol areas searched:', patrolAreas.value);
  } catch (error) {
    console.error('Failed to search patrol areas:', error);
  }
};

// 查看事件详情
const viewEventDetail = (event: any) => {
  selectedEvent.value = event;
  eventDetailVisible.value = true;
};

// 处理事件详情取消
const handleEventDetailCancel = () => {
  eventDetailVisible.value = false;
  selectedEvent.value = null;
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

// 获取无人机名称
const getDroneName = (droneId: number) => {
  const drone = drones.value.find(d => d.id === droneId);
  return drone ? drone.name : droneId;
};

// 地址缓存，避免重复请求

// 地址映射，使用reactive对象存储
const addressMap = reactive<Record<string, string>>({});

// 根据坐标获取地址
const getAddressFromCoords = async (lat: number, lng: number, key: string) => {
  try {
    // 使用高德地图逆地理编码API
    const response = await fetch(`https://restapi.amap.com/v3/geocode/regeo?key=4c5185429080b6b7227739411c6814c5&location=${lng},${lat}&radius=1000&extensions=base`);
    const data = await response.json();
    if (data.status === '1' && data.regeocode) {
      addressMap[key] = data.regeocode.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } else {
      addressMap[key] = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  } catch (error) {
    console.error('获取地址失败:', error);
    addressMap[key] = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

const formatLocation = (location: any) => {
  if (!location) return '未知';
  if (typeof location === 'string') {
    try {
      // 尝试解析JSON，如果成功则处理坐标
      const loc = JSON.parse(location);
      if (loc.lat && loc.lng) {
        const key = `${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`;
        if (!addressMap[key]) {
          // 异步获取地址
          getAddressFromCoords(loc.lat, loc.lng, key);
          return '加载中...';
        }
        return addressMap[key];
      } else if (loc.coordinates && loc.coordinates.length > 0) {
        // 处理 boundary 类型的对象
        const coords = loc.coordinates[0]; // 使用第一个坐标点
        if (coords && coords.length >= 2) {
          const key = `${coords[1].toFixed(6)},${coords[0].toFixed(6)}`;
          if (!addressMap[key]) {
            // 异步获取地址
            getAddressFromCoords(coords[1], coords[0], key);
            return '加载中...';
          }
          return addressMap[key];
        }
      }
      // 如果不是JSON或无法解析为坐标，则直接返回字符串（可能是区域名称）
      return location;
    } catch (e) {
      // 解析失败，直接返回字符串（可能是区域名称）
      return location;
    }
  } else if (location && typeof location === 'object') {
    if (location.lat && location.lng) {
      const key = `${location.lat.toFixed(6)},${location.lng.toFixed(6)}`;
      if (!addressMap[key]) {
        // 异步获取地址
        getAddressFromCoords(location.lat, location.lng, key);
        return '加载中...';
      }
      return addressMap[key];
    } else if (location.coordinates && location.coordinates.length > 0) {
      // 处理 boundary 类型的对象
      const coords = location.coordinates[0]; // 使用第一个坐标点
      if (coords && coords.length >= 2) {
        const key = `${coords[1].toFixed(6)},${coords[0].toFixed(6)}`;
        if (!addressMap[key]) {
          // 异步获取地址
          getAddressFromCoords(coords[1], coords[0], key);
          return '加载中...';
        }
        return addressMap[key];
      }
    }
    return '未知';
  }
  return '未知';
};
</script>

<style scoped>
.recognition-data {
  padding: 20px;
}

.search-filter {
  margin-bottom: 20px;
}

.event-detail {
  max-height: 600px;
  overflow-y: auto;
}
</style>