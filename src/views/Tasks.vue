<template>
  <div class="tasks-container">
    <div class="tasks-header">
      <h2>任务管理</h2>
      <button class="add-button" @click="openAddModal">
        添加任务
      </button>
    </div>
    <div class="tasks-filters">
      <select v-model="statusFilter" class="filter-select">
        <option value="all">所有状态</option>
        <option value="pending">待处理</option>
        <option value="in-progress">进行中</option>
        <option value="completed">已完成</option>
      </select>
      <input type="text" v-model="searchQuery" placeholder="搜索任务..." class="search-input" />
    </div>
    <div class="tasks-table-container">
      <table class="tasks-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>描述</th>
            <th>状态</th>
            <th>无人机</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in filteredTasks" :key="task.id">
            <td>{{ task.id }}</td>
            <td>{{ task.name }}</td>
            <td>{{ task.description }}</td>
            <td>
              <span :class="['status-badge', task.status]">{{ task.status }}</span>
            </td>
            <td>{{ getDroneName(task.drone) }}</td>
            <td>{{ formatDate(task.startTime) }}</td>
            <td>{{ formatDate(task.endTime) }}</td>
            <td>
              <button class="edit-button" @click="openEditModal(task)">
                编辑
              </button>
              <button class="delete-button" @click="deleteTask(task.id)">
                删除
              </button>
              <button class="status-button" @click="updateTaskStatus(task.id, getNextStatus(task.status))">
                {{ getNextStatusText(task.status) }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 添加任务模态框 -->
    <div class="modal" v-if="isAddModalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加任务</h3>
          <button class="close-button" @click="isAddModalOpen = false">
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>名称</label>
            <input type="text" v-model="newTask.name" class="form-input" />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="newTask.description" class="form-textarea"></textarea>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="newTask.status" class="form-select">
              <option value="pending">待处理</option>
              <option value="in-progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div class="form-group">
            <label>无人机</label>
            <select v-model="newTask.drone" class="form-select">
              <option v-for="drone in drones" :key="drone.id" :value="drone.id">{{ drone.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>开始时间</label>
            <input type="datetime-local" v-model="newTask.startTime" class="form-input" />
          </div>
          <div class="form-group">
            <label>结束时间</label>
            <input type="datetime-local" v-model="newTask.endTime" class="form-input" />
          </div>
          <div class="form-group">
            <label>路线</label>
            <input type="text" v-model="newTask.route" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-button" @click="isAddModalOpen = false">
            取消
          </button>
          <button class="save-button" @click="addTask">
            保存
          </button>
        </div>
      </div>
    </div>
    <!-- 编辑任务模态框 -->
    <div class="modal" v-if="isEditModalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑任务</h3>
          <button class="close-button" @click="isEditModalOpen = false">
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>名称</label>
            <input type="text" v-model="editingTask.name" class="form-input" />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="editingTask.description" class="form-textarea"></textarea>
          </div>
          <div class="form-group">
            <label>状态</label>
            <select v-model="editingTask.status" class="form-select">
              <option value="pending">待处理</option>
              <option value="in-progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div class="form-group">
            <label>无人机</label>
            <select v-model="editingTask.drone" class="form-select">
              <option v-for="drone in drones" :key="drone.id" :value="drone.id">{{ drone.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>开始时间</label>
            <input type="datetime-local" v-model="editingTask.startTime" class="form-input" />
          </div>
          <div class="form-group">
            <label>结束时间</label>
            <input type="datetime-local" v-model="editingTask.endTime" class="form-input" />
          </div>
          <div class="form-group">
            <label>路线</label>
            <input type="text" v-model="editingTask.route" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-button" @click="isEditModalOpen = false">
            取消
          </button>
          <button class="save-button" @click="updateTask">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { taskAPI, droneAPI, Task, Drone } from '../services/api'

// 任务数据
const tasks = ref<Task[]>([])
const drones = ref<Drone[]>([])
const searchQuery = ref('')
const statusFilter = ref('all')

// 模态框状态
const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)

// 新任务数据
const newTask = ref({
  name: '',
  description: '',
  status: 'pending' as 'pending' | 'in-progress' | 'completed',
  drone: '',
  startTime: new Date().toISOString().slice(0, 16),
  endTime: new Date().toISOString().slice(0, 16),
  route: ''
})

// 编辑任务数据
const editingTask = ref<Task>({
  id: '',
  name: '',
  description: '',
  status: 'pending',
  drone: '',
  startTime: new Date().toISOString().slice(0, 16),
  endTime: new Date().toISOString().slice(0, 16),
  route: ''
})

// 过滤后的任务列表
const filteredTasks = computed(() => {
  let result = tasks.value
  
  // 按状态过滤
  if (statusFilter.value !== 'all') {
    result = result.filter(task => task.status === statusFilter.value)
  }
  
  // 按搜索词过滤
  if (searchQuery.value) {
    result = result.filter(task => 
      task.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  return result
})

// 加载任务数据
const loadTasks = async () => {
  try {
    tasks.value = await taskAPI.getTasks()
  } catch (error) {
    console.error('Failed to load tasks:', error)
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

// 打开添加模态框
const openAddModal = () => {
  newTask.value = {
    name: '',
    description: '',
    status: 'pending',
    drone: drones.value.length > 0 ? drones.value[0].id : '',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date().toISOString().slice(0, 16),
    route: ''
  }
  isAddModalOpen.value = true
}

// 打开编辑模态框
const openEditModal = (task: Task) => {
  editingTask.value = { ...task }
  // 转换日期格式
  if (editingTask.value.startTime) {
    editingTask.value.startTime = new Date(editingTask.value.startTime).toISOString().slice(0, 16)
  }
  if (editingTask.value.endTime) {
    editingTask.value.endTime = new Date(editingTask.value.endTime).toISOString().slice(0, 16)
  }
  isEditModalOpen.value = true
}

// 添加任务
const addTask = async () => {
  try {
    await taskAPI.createTask(newTask.value)
    isAddModalOpen.value = false
    loadTasks()
  } catch (error) {
    console.error('Failed to add task:', error)
  }
}

// 更新任务
const updateTask = async () => {
  try {
    await taskAPI.updateTask(editingTask.value.id, editingTask.value)
    isEditModalOpen.value = false
    loadTasks()
  } catch (error) {
    console.error('Failed to update task:', error)
  }
}

// 删除任务
const deleteTask = async (id: string) => {
  if (confirm('确定要删除这个任务吗？')) {
    try {
      await taskAPI.deleteTask(id)
      loadTasks()
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }
}

// 更新任务状态
const updateTaskStatus = async (id: string, status: string) => {
  try {
    await taskAPI.updateTaskStatus(id, status)
    loadTasks()
  } catch (error) {
    console.error('Failed to update task status:', error)
  }
}

// 获取下一个状态
const getNextStatus = (currentStatus: string): string => {
  switch (currentStatus) {
    case 'pending':
      return 'in-progress'
    case 'in-progress':
      return 'completed'
    case 'completed':
      return 'pending'
    default:
      return 'pending'
  }
}

// 获取下一个状态文本
const getNextStatusText = (currentStatus: string): string => {
  switch (currentStatus) {
    case 'pending':
      return '开始'
    case 'in-progress':
      return '完成'
    case 'completed':
      return '重置'
    default:
      return '开始'
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
  await loadTasks()
})
</script>

<style scoped>
.tasks-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tasks-header h2 {
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

.tasks-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  flex: 0 0 150px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.tasks-table-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tasks-table {
  width: 100%;
  border-collapse: collapse;
}

.tasks-table th,
.tasks-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.tasks-table th {
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

.status-badge.pending {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-badge.in-progress {
  background-color: #fffbe6;
  color: #faad14;
}

.status-badge.completed {
  background-color: #e6f7ee;
  color: #52c41a;
}

.edit-button,
.delete-button,
.status-button {
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

.status-button {
  background-color: #52c41a;
  color: white;
}

.status-button:hover {
  background-color: #73d13d;
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
  width: 500px;
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
.form-select,
.form-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
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
