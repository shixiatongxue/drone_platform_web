<template>
  <div class="users-container">
    <div class="users-header">
      <h2>用户管理</h2>
      <button class="add-button" @click="openAddModal">
        添加用户
      </button>
    </div>
    <div class="users-search">
      <input type="text" v-model="searchQuery" placeholder="搜索用户..." class="search-input" />
    </div>
    <div class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>姓名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>最后登录</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, index) in filteredUsers" :key="user.id">
            <td>{{ index + 1 }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <span :class="['role-badge', user.role]">{{ user.role }}</span>
            </td>
            <td>{{ formatDate(user.lastLogin) }}</td>
            <td>
              <button class="edit-button" @click="openEditModal(user)">
                编辑
              </button>
              <button class="delete-button" @click="deleteUser(user.id)">
                删除
              </button>
              <button class="reset-password-button" @click="openResetPasswordModal(user)">
                重置密码
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- 添加用户模态框 -->
    <div class="modal" v-if="isAddModalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加用户</h3>
          <button class="close-button" @click="isAddModalOpen = false">
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>用户名</label>
            <input type="text" v-model="newUser.username" class="form-input" />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input type="password" v-model="newUser.password" class="form-input" />
          </div>
          <div class="form-group">
            <label>姓名</label>
            <input type="text" v-model="newUser.name" class="form-input" />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" v-model="newUser.email" class="form-input" />
          </div>
          <div class="form-group">
            <label>角色</label>
            <select v-model="newUser.role" class="form-select">
              <option value="admin">管理员</option>
              <option value="operator">操作员</option>
              <option value="viewer">查看者</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-button" @click="isAddModalOpen = false">
            取消
          </button>
          <button class="save-button" @click="addUser">
            保存
          </button>
        </div>
      </div>
    </div>
    <!-- 编辑用户模态框 -->
    <div class="modal" v-if="isEditModalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>编辑用户</h3>
          <button class="close-button" @click="isEditModalOpen = false">
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>用户名</label>
            <input type="text" v-model="editingUser.username" class="form-input" />
          </div>
          <div class="form-group">
            <label>姓名</label>
            <input type="text" v-model="editingUser.name" class="form-input" />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" v-model="editingUser.email" class="form-input" />
          </div>
          <div class="form-group">
            <label>角色</label>
            <select v-model="editingUser.role" class="form-select">
              <option value="admin">管理员</option>
              <option value="operator">操作员</option>
              <option value="viewer">查看者</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-button" @click="isEditModalOpen = false">
            取消
          </button>
          <button class="save-button" @click="updateUser">
            保存
          </button>
        </div>
      </div>
    </div>
    <!-- 重置密码模态框 -->
    <div class="modal" v-if="isResetPasswordModalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>重置密码</h3>
          <button class="close-button" @click="isResetPasswordModalOpen = false">
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>新密码</label>
            <input type="password" v-model="newPassword" class="form-input" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-button" @click="isResetPasswordModalOpen = false">
            取消
          </button>
          <button class="save-button" @click="resetPassword">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { userAPI, User } from '../services/api'

// 用户数据
const users = ref<User[]>([])
const searchQuery = ref('')

// 模态框状态
const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isResetPasswordModalOpen = ref(false)

// 新用户数据
const newUser = ref({
  username: '',
  password: '',
  name: '',
  email: '',
  role: 'operator'
})

// 编辑用户数据
const editingUser = ref<User>({
  id: 0,
  username: '',
  password: '',
  name: '',
  email: '',
  role: 'operator',
  lastLogin: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

// 重置密码数据
const newPassword = ref('')
const resetPasswordUserId = ref(0)

// 过滤后的用户列表
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  return users.value.filter(user => 
    user.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 加载用户数据
const loadUsers = async () => {
  try {
    users.value = await userAPI.getUsers()
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

// 打开添加模态框
const openAddModal = () => {
  newUser.value = {
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'operator'
  }
  isAddModalOpen.value = true
}

// 打开编辑模态框
const openEditModal = (user: User) => {
  editingUser.value = { ...user }
  isEditModalOpen.value = true
}

// 打开重置密码模态框
const openResetPasswordModal = (user: User) => {
  resetPasswordUserId.value = user.id
  newPassword.value = ''
  isResetPasswordModalOpen.value = true
}

// 添加用户
const addUser = async () => {
  try {
    await userAPI.createUser(newUser.value)
    isAddModalOpen.value = false
    loadUsers()
  } catch (error) {
    console.error('Failed to add user:', error)
  }
}

// 更新用户
const updateUser = async () => {
  try {
    await userAPI.updateUser(editingUser.value.id, editingUser.value)
    isEditModalOpen.value = false
    loadUsers()
  } catch (error) {
    console.error('Failed to update user:', error)
  }
}

// 删除用户
const deleteUser = async (id: number) => {
  if (confirm('确定要删除这个用户吗？')) {
    try {
      await userAPI.deleteUser(id)
      loadUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }
}

// 重置密码
const resetPassword = async () => {
  try {
    await userAPI.updatePassword(resetPasswordUserId.value, newPassword.value)
    isResetPasswordModalOpen.value = false
    loadUsers()
  } catch (error) {
    console.error('Failed to reset password:', error)
  }
}

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
}

// 页面加载时加载数据
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.users-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.users-header h2 {
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

.users-search {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.users-table-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.users-table th {
  background-color: #fafafa;
  font-weight: 600;
  color: #333;
}

.role-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge.admin {
  background-color: #e6f7ee;
  color: #52c41a;
}

.role-badge.operator {
  background-color: #e6f7ff;
  color: #1890ff;
}

.role-badge.viewer {
  background-color: #fff2e8;
  color: #fa8c16;
}

.edit-button,
.delete-button,
.reset-password-button {
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

.reset-password-button {
  background-color: #faad14;
  color: white;
}

.reset-password-button:hover {
  background-color: #ffc53d;
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