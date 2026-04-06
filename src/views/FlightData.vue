<template>
  <div class="flight-data-container">
    <div class="flight-data-header">
      <h2>飞行数据管理</h2>
      <button class="add-button" @click="openAddModal">
        添加飞行记录
      </button>
    </div>
    <div class="flight-data-filters">
      <select v-model="droneFilter" class="filter-select">
        <option value="all">所有无人机</option>
        <option v-for="drone in drones" :key="drone.id" :value="drone.id">{{ drone.name }}</option>
      </select>
      <input type="text" v-model="searchQuery" placeholder="搜索飞行记录..." class="search-input" />
    </div>
    <div class="flight-data-statistics">
      <div class="stat-card">
        <h3>总飞行次数</h3>
        <p class="stat-value">{{ statistics.totalFlights || 0 }}</p>
      </div>
      <div class="stat-card">
        <h3>总飞行时间</h3>
        <p class="stat-value">{{ statistics.totalDuration || 0 }} 分钟</p>
      </div>
      <div class="stat-card">
        <h3>最高飞行高度</h3>
        <p class="stat-value">{{ statistics.maxAltitude || 0 }} 米</p>
      </div>
      <div class="stat-card">
        <h3>最高飞行速度</h3>
        <p class="stat-value">{{ statistics.maxSpeed || 0 }} m/s</p>
      </div>
      <div class="stat-card">
        <h3>平均电池消耗</h3>
        <p class="stat-value">{{ statistics.avgBatteryConsumption || 0 }}%</p>
      </div>
    </div>
    <div class="flight-data-table-container">
      <table class="flight-data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>无人机</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>飞行时长</th>
            <th>最高高度</th>
            <th>最高速度</th>
            <th>电池消耗</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in filteredFlightRecords" :key="record.id">
            <td>{{ record.id }}</td>
            <td>{{ getDroneName(record.drone) }}</td>
            <td>{{ formatDate(record.startTime) }}</td>
            <td>{{ formatDate(record.endTime) }}</td>
            <td>{{ record.duration }}</td>
            <td>{{ record.maxAltitude }} 米</td>
            <td>{{ record.maxSpeed }} m/s</td>
            <td>{{ record.batteryConsumption }}%</td>
            <td>
              <button class="edit-button" @click="openEditModal(record)">
                编辑
              </button>
              <button class="delete-button" @click="deleteFlightRecord(record.id)">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 添加飞行记录模态框 -->
    <div class="modal" v-if="isAddModalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加飞行记录</h3>
          <button class="close-button" @click="isAddModalOpen = false">
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>无人机</label>
            <select v-model="newFlightRecord.drone" class="form-select">
              <option v-for="drone in drones" :key="drone.id" :value="drone.id">{{ drone.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>开始时间</label>
            <input type="datetime-local" v-model="newFlightRecord.startTime" class="form-input" />
          </div>
          <div class="form-group">
            <label>结束时间</label>
            <input type="datetime-local" v-model="newFlightRecord.endTime" class="form-input" />
          </div>
          <div class="form-group">
            <label>飞行时长</label>
            <input type="text" v-model="newFlightRecord.duration" class="form-input" placeholder="例如: 01:30:00" />
          </div>
          <div class="form-group">
            <label>最高高度</label>
            <input type="number" v-model="newFlightRecord.maxAltitude" class="form-input" />
          </div>
          <div class="form-group">
            <label>最高速度</label>
            <input type="number" v-model="newFlightRecord.maxSpeed" class="form-input" />
          </div>
          <div class="form-group">
            <label>电池消耗</label>
            <input type="number" v-model="newFlightRecord.batteryConsumption" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-button" @click="isAddModalOpen = false">
            取消
          </button>
          <button class="save-button" @click="addFlightRecord">
            保存
          </button>
        </div>
      </div>
    </div>
    <!-- 编辑飞行记录模态框 -->
    <div class="modal" v-if="isEditModalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑飞行记录</h3>
          <button class="close-button" @click="isEditModalOpen = false">
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>无人机</label>
            <select v-model="editingFlightRecord.drone" class="form-select">
              <option v-for="drone in drones" :key="drone.id" :value="drone.id">{{ drone.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>开始时间</label>
            <input type="datetime-local" v-model="editingFlightRecord.startTime" class="form-input" />
          </div>
          <div class="form-group">
            <label>结束时间</label>
            <input type="datetime-local" v-model="editingFlightRecord.endTime" class="form-input" />
          </div>
          <div class="form-group">
            <label>飞行时长</label>
            <input type="text" v-model="editingFlightRecord.duration" class="form-input" placeholder="例如: 01:30:00" />
          </div>
          <div class="form-group">
            <label>最高高度</label>
            <input type="number" v-model="editingFlightRecord.maxAltitude" class="form-input" />
          </div>
          <div class="form-group">
            <label>最高速度</label>
            <input type="number" v-model="editingFlightRecord.maxSpeed" class="form-input" />
          </div>
          <div class="form-group">
            <label>电池消耗</label>
            <input type="number" v-model="editingFlightRecord.batteryConsumption" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-button" @click="isEditModalOpen = false">
            取消
          </button>
          <button class="save-button" @click="updateFlightRecord">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { flightDataAPI, droneAPI, FlightRecord, Drone, FlightStatistics } from '../services/api'

// 飞行记录数据
const flightRecords = ref<FlightRecord[]>([])
const drones = ref<Drone[]>([])
const searchQuery = ref('')
const droneFilter = ref('all')

// 统计数据
const statistics = ref<FlightStatistics>({
  totalFlights: 0,
  totalDuration: 0,
  maxAltitude: 0,
  maxSpeed: 0,
  avgBatteryConsumption: 0
})

// 模态框状态
const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)

// 新飞行记录数据
const newFlightRecord = ref({
  drone: '',
  startTime: new Date().toISOString().slice(0, 16),
  endTime: new Date().toISOString().slice(0, 16),
  duration: '00:00:00',
  maxAltitude: 0,
  maxSpeed: 0,
  batteryConsumption: 0
})

// 编辑飞行记录数据
const editingFlightRecord = ref<FlightRecord>({
  id: '',
  drone: '',
  startTime: new Date().toISOString().slice(0, 16),
  endTime: new Date().toISOString().slice(0, 16),
  duration: '00:00:00',
  maxAltitude: 0,
  maxSpeed: 0,
  batteryConsumption: 0
})

// 过滤后的飞行记录列表
const filteredFlightRecords = computed(() => {
  let result = flightRecords.value
  
  // 按无人机过滤
  if (droneFilter.value !== 'all') {
    result = result.filter(record => record.drone === droneFilter.value)
  }
  
  // 按搜索词过滤
  if (searchQuery.value) {
    result = result.filter(record => 
      getDroneName(record.drone).toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      record.duration.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  return result
})

// 加载飞行记录数据
const loadFlightRecords = async () => {
  try {
    flightRecords.value = await flightDataAPI.getFlightRecords()
  } catch (error) {
    console.error('Failed to load flight records:', error)
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

// 加载统计数据
const loadStatistics = async () => {
  try {
    statistics.value = await flightDataAPI.getFlightStatistics()
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}

// 打开添加模态框
const openAddModal = () => {
  newFlightRecord.value = {
    drone: drones.value.length > 0 ? drones.value[0].id : '',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date().toISOString().slice(0, 16),
    duration: '00:00:00',
    maxAltitude: 0,
    maxSpeed: 0,
    batteryConsumption: 0
  }
  isAddModalOpen.value = true
}

// 打开编辑模态框
const openEditModal = (record: FlightRecord) => {
  editingFlightRecord.value = { ...record }
  // 转换日期格式
  if (editingFlightRecord.value.startTime) {
    editingFlightRecord.value.startTime = new Date(editingFlightRecord.value.startTime).toISOString().slice(0, 16)
  }
  if (editingFlightRecord.value.endTime) {
    editingFlightRecord.value.endTime = new Date(editingFlightRecord.value.endTime).toISOString().slice(0, 16)
  }
  isEditModalOpen.value = true
}

// 添加飞行记录
const addFlightRecord = async () => {
  try {
    await flightDataAPI.createFlightRecord(newFlightRecord.value)
    isAddModalOpen.value = false
    await loadFlightRecords()
    await loadStatistics()
  } catch (error) {
    console.error('Failed to add flight record:', error)
  }
}

// 更新飞行记录
const updateFlightRecord = async () => {
  try {
    await flightDataAPI.updateFlightRecord(editingFlightRecord.value.id, editingFlightRecord.value)
    isEditModalOpen.value = false
    await loadFlightRecords()
    await loadStatistics()
  } catch (error) {
    console.error('Failed to update flight record:', error)
  }
}

// 删除飞行记录
const deleteFlightRecord = async (id: string) => {
  if (confirm('确定要删除这个飞行记录吗？')) {
    try {
      await flightDataAPI.deleteFlightRecord(id)
      await loadFlightRecords()
      await loadStatistics()
    } catch (error) {
      console.error('Failed to delete flight record:', error)
    }
  }
}

// 获取无人机名称
const getDroneName = (droneId: string): string => {
  const drone = drones.value.find(d => d.id === droneId)
  return drone ? drone.name : '未知'
}

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
}

// 页面加载时加载数据
onMounted(async () => {
  await loadDrones()
  await loadFlightRecords()
  await loadStatistics()
})
</script>

<style scoped>
.flight-data-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.flight-data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.flight-data-header h2 {
  margin: 0;
  color: #333;
}

.add-button {
  padding: 8px 16px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.add-button:hover {
  background-color: #40a9ff;
}

.flight-data-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  flex: 0 0 200px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.flight-data-statistics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background-color: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.stat-value {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.flight-data-table-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.flight-data-table {
  width: 100%;
  border-collapse: collapse;
}

.flight-data-table th,
.flight-data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.flight-data-table th {
  background-color: #fafafa;
  font-weight: 600;
  color: #333;
}

.edit-button,
.delete-button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 4px;
}

.edit-button {
  background-color: #1890ff;
  color: white;
}

.edit-button:hover {
  background-color: #40a9ff;
}

.delete-button {
  background-color: #f5222d;
  color: white;
}

.delete-button:hover {
  background-color: #ff4d4f;
}

/* 模态框样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  gap: 8px;
}

.cancel-button,
.save-button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-button {
  background-color: white;
  color: #333;
}

.cancel-button:hover {
  background-color: #f5f5f5;
}

.save-button {
  background-color: #1890ff;
  color: white;
  border: none;
}

.save-button:hover {
  background-color: #40a9ff;
}
</style>
