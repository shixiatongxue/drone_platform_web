<template>
  <div class="drones-container">
    <div class="drones-header">
      <h2>无人机管理</h2>
      <button class="add-button" @click="openAddModal">
        添加无人机
      </button>
    </div>
    <div class="drones-search">
      <input type="text" v-model="searchQuery" placeholder="搜索无人机..." class="search-input" />
    </div>
    <div class="drones-table-container">
      <table class="drones-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>型号</th>
            <th>状态</th>
            <th>电量</th>
            <th>位置</th>
            <th>最后活动</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="drone in filteredDrones" :key="drone.id">
            <td>{{ drone.id }}</td>
            <td>{{ drone.name }}</td>
            <td>{{ drone.model }}</td>
            <td>
              <span :class="['status-badge', drone.status]">{{ drone.status }}</span>
            </td>
            <td>{{ drone.battery }}%</td>
            <td>{{ drone.location }}</td>
            <td>{{ formatDate(drone.lastActivity) }}</td>
            <td>
              <button class="edit-button" @click="openEditModal(drone)">
                编辑
              </button>
              <button class="delete-button" @click="deleteDrone(drone.id)">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 添加无人机模态框 -->
    <div class="modal" v-if="isAddModalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加无人机</h3>
          <button class="close-button" @click="isAddModalOpen = false">
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>名称</label>
            <input type="text" v-model="newDrone.name" class="form-input" />
          </div>
          <div class="form-group">
            <label>型号</label>
            <input type="text" v-model="newDrone.model" class="form-input" />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="newDrone.status" class="form-select">
              <option value="online">在线</option>
              <option value="offline">离线</option>
              <option value="flying">飞行中</option>
            </select>
          </div>
          <div class="form-group">
            <label>电量</label>
            <input type="number" v-model="newDrone.battery" min="0" max="100" class="form-input" />
          </div>
          <div class="form-group">
            <label>位置</label>
            <input type="text" v-model="newDrone.location" class="form-input" />
          </div>
          <div class="form-group">
            <label>最后活动</label>
            <input type="datetime-local" v-model="newDrone.lastActivity" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-button" @click="isAddModalOpen = false">
            取消
          </button>
          <button class="save-button" @click="addDrone">
            保存
          </button>
        </div>
      </div>
    </div>
    <!-- 编辑无人机模态框 -->
    <div class="modal" v-if="isEditModalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑无人机</h3>
          <button class="close-button" @click="isEditModalOpen = false">
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>名称</label>
            <input type="text" v-model="editingDrone.name" class="form-input" />
          </div>
          <div class="form-group">
            <label>型号</label>
            <input type="text" v-model="editingDrone.model" class="form-input" />
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="editingDrone.status" class="form-select">
              <option value="online">在线</option>
              <option value="offline">离线</option>
              <option value="flying">飞行中</option>
            </select>
          </div>
          <div class="form-group">
            <label>电量</label>
            <input type="number" v-model="editingDrone.battery" min="0" max="100" class="form-input" />
          </div>
          <div class="form-group">
            <label>位置</label>
            <input type="text" v-model="editingDrone.location" class="form-input" />
          </div>
          <div class="form-group">
            <label>最后活动</label>
            <input type="datetime-local" v-model="editingDrone.lastActivity" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-button" @click="isEditModalOpen = false">
            取消
          </button>
          <button class="save-button" @click="updateDrone">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { droneAPI, Drone } from '../services/api'

// 无人机数据
const drones = ref<Drone[]>([])
const searchQuery = ref('')

// 模态框状态
const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)

// 新无人机数据
const newDrone = ref({
  name: '',
  model: '',
  status: 'offline' as 'online' | 'offline' | 'flying',
  battery: 100,
  location: '北京',
  lastActivity: new Date().toISOString().slice(0, 16)
})

// 编辑无人机数据
const editingDrone = ref<Drone>({
  id: 0,
  name: '',
  model: '',
  status: 'offline',
  battery: 100,
  location: '北京',
  lastActivity: new Date().toISOString().slice(0, 16)
})

// 过滤后的无人机列表
const filteredDrones = computed(() => {
  if (!searchQuery.value) return drones.value
  return drones.value.filter(drone => 
    drone.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    drone.model.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    drone.location.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 加载无人机数据
const loadDrones = async () => {
  try {
    drones.value = await droneAPI.getDrones()
  } catch (error) {
    console.error('Failed to load drones:', error)
  }
}

// 打开添加模态框
const openAddModal = () => {
  newDrone.value = {
    name: '',
    model: '',
    status: 'offline',
    battery: 100,
    location: '北京',
    lastActivity: new Date().toISOString().slice(0, 16)
  }
  isAddModalOpen.value = true
}

// 打开编辑模态框
const openEditModal = (drone: Drone) => {
  editingDrone.value = { ...drone }
  // 转换日期格式
  if (editingDrone.value.lastActivity) {
    editingDrone.value.lastActivity = new Date(editingDrone.value.lastActivity).toISOString().slice(0, 16)
  }
  isEditModalOpen.value = true
}

// 添加无人机
const addDrone = async () => {
  try {
    await droneAPI.createDrone(newDrone.value)
    isAddModalOpen.value = false
    loadDrones()
  } catch (error) {
    console.error('Failed to add drone:', error)
  }
}

// 更新无人机
const updateDrone = async () => {
  try {
    await droneAPI.updateDrone(editingDrone.value.id, editingDrone.value)
    isEditModalOpen.value = false
    loadDrones()
  } catch (error) {
    console.error('Failed to update drone:', error)
  }
}

// 删除无人机
const deleteDrone = async (id: number) => {
  if (confirm('确定要删除这个无人机吗？')) {
    try {
      await droneAPI.deleteDrone(id)
      loadDrones()
    } catch (error) {
      console.error('Failed to delete drone:', error)
    }
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

// 页面加载时加载数据
onMounted(() => {
  loadDrones()
})
</script>

<style scoped>
.drones-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.drones-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.drones-header h2 {
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

.drones-search {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.drones-table-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.drones-table {
  width: 100%;
  border-collapse: collapse;
}

.drones-table th,
.drones-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.drones-table th {
  background-color: #fafafa;
  font-weight: 600;
  color: #333;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.online {
  background-color: #e6f7ee;
  color: #52c41a;
}

.status-badge.offline {
  background-color: #fff2f0;
  color: #f5222d;
}

.status-badge.flying {
  background-color: #fffbe6;
  color: #faad14;
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
