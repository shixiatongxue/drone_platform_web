<template>
  <div class="flight-data-container">
    <div class="flight-data-header">
      <h2>飞行数据管理</h2>
      <div class="header-buttons">
        <button class="add-button" @click="openAddModal">
          添加飞行记录
        </button>
        <button class="export-button" @click="exportToPDF">
          导出PDF
        </button>
      </div>
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
    <!-- 图表区域 -->
    <div class="flight-data-charts" v-if="showCharts">
      <div class="chart-row">
        <div class="chart-container">
          <h3>飞行时长趋势</h3>
          <div ref="durationChartRef" class="chart"></div>
        </div>
        <div class="chart-container">
          <h3>飞行高度分布</h3>
          <div ref="altitudeChartRef" class="chart"></div>
        </div>
      </div>
      <div class="chart-row">
        <div class="chart-container">
          <h3>飞行高度变化示意图</h3>
          <div ref="altitudeChangeChartRef" class="chart"></div>
        </div>
        <div class="chart-container">
          <h3>电池消耗分析</h3>
          <div ref="batteryChartRef" class="chart"></div>
        </div>
      </div>
      <!-- 只有选择所有无人机时才显示的图表 -->
      <div v-if="droneFilter === 'all'">
        <div class="chart-row">
          <div class="chart-container">
            <h3>无人机飞行次数</h3>
            <div ref="droneFlightsChartRef" class="chart"></div>
          </div>
          <div class="chart-container">
            <h3>各无人机飞行时长对比</h3>
            <div ref="droneDurationChartRef" class="chart"></div>
          </div>
        </div>
        <div class="chart-row">
          <div class="chart-container">
            <h3>各无人机平均飞行高度</h3>
            <div ref="droneAltitudeChartRef" class="chart"></div>
          </div>
        </div>
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
          <tr v-for="(record, index) in filteredFlightRecords" :key="record.id">
            <td>{{ index + 1 }}</td>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { flightDataAPI, droneAPI, FlightRecord, Drone, FlightStatistics } from '../services/api'
import * as echarts from 'echarts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// 飞行记录数据
const flightRecords = ref<FlightRecord[]>([])
const drones = ref<Drone[]>([])
const searchQuery = ref('')
const droneFilter = ref('all')
// 控制图表显示/隐藏
const showCharts = ref(true)

// 图表引用
const durationChartRef = ref<HTMLElement>()
const altitudeChartRef = ref<HTMLElement>()
const batteryChartRef = ref<HTMLElement>()
const altitudeChangeChartRef = ref<HTMLElement>()
const droneFlightsChartRef = ref<HTMLElement>()
const droneDurationChartRef = ref<HTMLElement>()
const droneAltitudeChartRef = ref<HTMLElement>()

// 图表实例
let durationChart: echarts.ECharts | null = null
let altitudeChart: echarts.ECharts | null = null
let batteryChart: echarts.ECharts | null = null
let altitudeChangeChart: echarts.ECharts | null = null
let droneFlightsChart: echarts.ECharts | null = null
let droneDurationChart: echarts.ECharts | null = null
let droneAltitudeChart: echarts.ECharts | null = null

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
  drone: 0,
  startTime: new Date().toISOString().slice(0, 16),
  endTime: new Date().toISOString().slice(0, 16),
  duration: '00:00:00',
  maxAltitude: 0,
  maxSpeed: 0,
  batteryConsumption: 0
})

// 编辑飞行记录数据
const editingFlightRecord = ref<FlightRecord>({
  id: 0,
  drone: 0,
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
    result = result.filter(record => record.drone === parseInt(droneFilter.value))
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
    // 加载数据后更新图表
    updateCharts()
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
const loadStatistics = async (droneId?: string) => {
  try {
    if (droneId && droneId !== 'all') {
      // 这里需要后端提供根据无人机ID获取统计数据的API
      // 暂时使用前端计算的方式
      const filteredRecords = flightRecords.value.filter(record => record.drone === parseInt(droneId))
      calculateStatistics(filteredRecords)
    } else {
      statistics.value = await flightDataAPI.getFlightStatistics()
    }
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}

// 计算统计数据
const calculateStatistics = (records: FlightRecord[]) => {
  if (records.length === 0) {
    statistics.value = {
      totalFlights: 0,
      totalDuration: 0,
      maxAltitude: 0,
      maxSpeed: 0,
      avgBatteryConsumption: 0
    }
    return
  }

  const totalFlights = records.length
  
  // 计算总飞行时间（分钟）
  const totalDurationMinutes = records.reduce((total, record) => {
    const parts = record.duration.split(':')
    return total + parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60
  }, 0)
  
  // 计算最高飞行高度
  const maxAltitude = Math.max(...records.map(record => record.maxAltitude))
  
  // 计算最高飞行速度
  const maxSpeed = Math.max(...records.map(record => record.maxSpeed))
  
  // 计算平均电池消耗
  const avgBatteryConsumption = records.reduce((sum, record) => sum + record.batteryConsumption, 0) / records.length

  statistics.value = {
    totalFlights,
    totalDuration: Math.round(totalDurationMinutes),
    maxAltitude,
    maxSpeed,
    avgBatteryConsumption: parseFloat(avgBatteryConsumption.toFixed(1))
  }
}

// 打开添加模态框
const openAddModal = () => {
  newFlightRecord.value = {
    drone: drones.value.length > 0 ? drones.value[0].id : 0,
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
    await loadStatistics(droneFilter.value)
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
    await loadStatistics(droneFilter.value)
  } catch (error) {
    console.error('Failed to update flight record:', error)
  }
}

// 删除飞行记录
const deleteFlightRecord = async (id: number) => {
  if (confirm('确定要删除这个飞行记录吗？')) {
    try {
      await flightDataAPI.deleteFlightRecord(id)
      await loadFlightRecords()
      await loadStatistics(droneFilter.value)
    } catch (error) {
      console.error('Failed to delete flight record:', error)
    }
  }
}

// 获取无人机名称
const getDroneName = (droneId: number): string => {
  const drone = drones.value.find(d => d.id === droneId)
  return drone ? drone.name : '未知'
}

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
}

// 初始化图表
const initCharts = () => {
  if (durationChartRef.value) {
    durationChart = echarts.init(durationChartRef.value)
  }
  if (altitudeChartRef.value) {
    altitudeChart = echarts.init(altitudeChartRef.value)
  }
  if (batteryChartRef.value) {
    batteryChart = echarts.init(batteryChartRef.value)
  }
  if (altitudeChangeChartRef.value) {
    altitudeChangeChart = echarts.init(altitudeChangeChartRef.value)
  }
  if (droneFlightsChartRef.value) {
    droneFlightsChart = echarts.init(droneFlightsChartRef.value)
  }
  if (droneDurationChartRef.value) {
    droneDurationChart = echarts.init(droneDurationChartRef.value)
  }
  if (droneAltitudeChartRef.value) {
    droneAltitudeChart = echarts.init(droneAltitudeChartRef.value)
  }
  updateCharts()
}

// 更新图表
const updateCharts = () => {
  updateDurationChart()
  updateAltitudeChart()
  updateBatteryChart()
  updateAltitudeChangeChart()
  updateDroneFlightsChart()
  updateDroneDurationChart()
  updateDroneAltitudeChart()
}

// 获取当前过滤后的飞行记录
const getFilteredRecords = () => {
  if (droneFilter.value === 'all') {
    return flightRecords.value
  }
  return flightRecords.value.filter(record => record.drone === parseInt(droneFilter.value))
}

// 更新飞行时长趋势图表
const updateDurationChart = () => {
  if (!durationChart) return
  
  const filteredRecords = getFilteredRecords()
  
  // 按日期排序飞行记录
  const sortedRecords = [...filteredRecords].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )
  
  const dates = sortedRecords.map(record => {
    const date = new Date(record.startTime)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  
  const durations = sortedRecords.map(record => {
    // 解析飞行时长（格式：HH:MM:SS）
    const parts = record.duration.split(':')
    return parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60
  })
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 分钟'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '飞行时长（分钟）'
    },
    series: [
      {
        name: '飞行时长',
        type: 'line',
        stack: 'Total',
        data: durations,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.6)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
          ])
        },
        lineStyle: {
          color: '#1890ff'
        },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  }
  
  durationChart.setOption(option)
}

// 更新飞行高度分布图表
const updateAltitudeChart = () => {
  if (!altitudeChart) return
  
  const filteredRecords = getFilteredRecords()
  const altitudes = filteredRecords.map(record => record.maxAltitude)
  const bins = [0, 50, 100, 150, 200, 250, 300]
  const counts = Array(bins.length - 1).fill(0)
  
  altitudes.forEach(altitude => {
    for (let i = 0; i < bins.length - 1; i++) {
      if (altitude >= bins[i] && altitude < bins[i + 1]) {
        counts[i]++
        break
      }
    }
  })
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 次'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: bins.slice(0, -1).map((bin, index) => `${bin}-${bins[index + 1]}m`)
    },
    yAxis: {
      type: 'value',
      name: '飞行次数'
    },
    series: [
      {
        name: '飞行次数',
        type: 'bar',
        data: counts,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#52c41a' },
            { offset: 1, color: '#73d13d' }
          ])
        },
        barWidth: '60%'
      }
    ]
  }
  
  altitudeChart.setOption(option)
}

// 更新电池消耗分析图表
const updateBatteryChart = () => {
  if (!batteryChart) return
  
  const filteredRecords = getFilteredRecords()
  
  // 按日期排序飞行记录
  const sortedRecords = [...filteredRecords].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )
  
  const dates = sortedRecords.map(record => {
    const date = new Date(record.startTime)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  
  const batteryConsumptions = sortedRecords.map(record => record.batteryConsumption)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '电池消耗（%）',
      min: 0,
      max: 100
    },
    series: [
      {
        name: '电池消耗',
        type: 'line',
        data: batteryConsumptions,
        smooth: true,
        lineStyle: {
          color: '#faad14'
        },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#faad14'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(250, 173, 20, 0.6)' },
            { offset: 1, color: 'rgba(250, 173, 20, 0.1)' }
          ])
        }
      }
    ]
  }
  
  batteryChart.setOption(option)
}

// 更新飞行高度变化示意图
const updateAltitudeChangeChart = () => {
  if (!altitudeChangeChart) return
  
  const filteredRecords = getFilteredRecords()
  
  // 按日期排序飞行记录
  const sortedRecords = [...filteredRecords].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )
  
  const dates = sortedRecords.map(record => {
    const date = new Date(record.startTime)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  
  const altitudes = sortedRecords.map(record => record.maxAltitude)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 米'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '飞行高度（米）'
    },
    series: [
      {
        name: '飞行高度',
        type: 'line',
        data: altitudes,
        smooth: true,
        lineStyle: {
          color: '#1890ff',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#1890ff'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.6)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
          ])
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c} 米'
        }
      }
    ]
  }
  
  altitudeChangeChart.setOption(option)
}

// 更新无人机飞行次数图表
const updateDroneFlightsChart = () => {
  if (!droneFlightsChart) return
  
  const filteredRecords = getFilteredRecords()
  const droneFlightCounts = new Map<number, number>()
  filteredRecords.forEach(record => {
    droneFlightCounts.set(record.drone, (droneFlightCounts.get(record.drone) || 0) + 1)
  })
  
  const droneNames = Array.from(droneFlightCounts.keys()).map(droneId => 
    getDroneName(droneId)
  )
  const counts = Array.from(droneFlightCounts.values())
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} 次 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: droneNames
    },
    series: [
      {
        name: '飞行次数',
        type: 'pie',
        radius: '60%',
        center: ['60%', '50%'],
        data: droneNames.map((name, index) => ({
          name,
          value: counts[index]
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        }
      }
    ]
  }
  
  droneFlightsChart.setOption(option)
}

// 更新各无人机飞行时长对比图表
const updateDroneDurationChart = () => {
  if (!droneDurationChart) return
  
  const filteredRecords = getFilteredRecords()
  const droneDurationMap = new Map<number, number>()
  filteredRecords.forEach(record => {
    // 解析飞行时长（格式：HH:MM:SS）
    const parts = record.duration.split(':')
    const durationMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60
    droneDurationMap.set(record.drone, (droneDurationMap.get(record.drone) || 0) + durationMinutes)
  })
  
  const droneNames = Array.from(droneDurationMap.keys()).map(droneId => 
    getDroneName(droneId)
  )
  const durations = Array.from(droneDurationMap.values())
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}: {c} 分钟'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: droneNames,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '总飞行时长（分钟）'
    },
    series: [
      {
        name: '飞行时长',
        type: 'bar',
        data: durations,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#1890ff' },
            { offset: 1, color: '#40a9ff' }
          ])
        },
        barWidth: '60%',
        label: {
          show: true,
          position: 'top',
          formatter: '{c} 分钟'
        }
      }
    ]
  }
  
  droneDurationChart.setOption(option)
}

// 更新各无人机平均飞行高度图表
const updateDroneAltitudeChart = () => {
  if (!droneAltitudeChart) return
  
  const filteredRecords = getFilteredRecords()
  const droneAltitudeMap = new Map<number, { sum: number; count: number }>()
  filteredRecords.forEach(record => {
    if (!droneAltitudeMap.has(record.drone)) {
      droneAltitudeMap.set(record.drone, { sum: 0, count: 0 })
    }
    const data = droneAltitudeMap.get(record.drone)!
    data.sum += record.maxAltitude
    data.count += 1
  })
  
  const droneNames = Array.from(droneAltitudeMap.keys()).map(droneId => 
    getDroneName(droneId)
  )
  const avgAltitudes = Array.from(droneAltitudeMap.values()).map(data => 
    data.sum / data.count
  )
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 米'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: droneNames,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '平均飞行高度（米）'
    },
    series: [
      {
        name: '平均飞行高度',
        type: 'line',
        data: avgAltitudes,
        smooth: true,
        lineStyle: {
          color: '#52c41a',
          width: 3
        },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#52c41a'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(82, 196, 26, 0.6)' },
            { offset: 1, color: 'rgba(82, 196, 26, 0.1)' }
          ])
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c} 米'
        }
      }
    ]
  }
  
  droneAltitudeChart.setOption(option)
}

// 过滤无效的飞行记录（包含不存在的无人机ID）
const filterInvalidFlightRecords = async () => {
  const drones = await droneAPI.getDrones()
  const validDroneIds = new Set(drones.map(drone => drone.id))
  
  // 找出无效的飞行记录
  const invalidRecords = flightRecords.value.filter(record => !validDroneIds.has(record.drone))
  
  // 删除无效的飞行记录
  for (const record of invalidRecords) {
    try {
      await flightDataAPI.deleteFlightRecord(record.id)
      console.log(`Deleted invalid flight record with drone ID: ${record.drone}`)
    } catch (error) {
      console.error('Failed to delete invalid flight record:', error)
    }
  }
  
  // 重新加载数据
  if (invalidRecords.length > 0) {
    await loadFlightRecords()
    await loadStatistics(droneFilter.value)
    updateCharts()
  }
}

// 生成更多飞行数据
const generateMoreFlightData = async () => {
  // 检查是否已有足够数据
  if (flightRecords.value.length >= 20) return
  
  const drones = await droneAPI.getDrones()
  if (drones.length === 0) return
  
  const now = new Date()
  const newRecords = []
  
  // 为每个无人机生成3-5条飞行记录
  for (const drone of drones) {
    const recordCount = Math.floor(Math.random() * 3) + 3
    for (let i = 0; i < recordCount; i++) {
      const startTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      const durationMinutes = Math.floor(Math.random() * 60) + 10
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)
      
      const record = {
        drone: drone.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: `00:${durationMinutes.toString().padStart(2, '0')}:00`,
        maxAltitude: Math.floor(Math.random() * 250) + 50,
        maxSpeed: Math.floor(Math.random() * 40) + 30,
        batteryConsumption: Math.floor(Math.random() * 30) + 10
      }
      
      try {
        await flightDataAPI.createFlightRecord(record)
        newRecords.push(record)
      } catch (error) {
        console.error('Failed to create flight record:', error)
      }
    }
  }
  
  // 重新加载数据
  await loadFlightRecords()
  await loadStatistics(droneFilter.value)
  updateCharts()
  
  // 过滤无效的飞行记录
  await filterInvalidFlightRecords()
}

// 页面加载时加载数据
onMounted(async () => {
  await loadDrones()
  await loadFlightRecords()
  await loadStatistics(droneFilter.value)
  
  // 过滤无效的飞行记录
  await filterInvalidFlightRecords()
  
  // 生成更多数据
  await generateMoreFlightData()
  
  // 初始化图表
  initCharts()
  
  // 监听窗口 resize
  window.addEventListener('resize', handleResize)
})

// 处理窗口 resize
const handleResize = () => {
  durationChart?.resize()
  altitudeChart?.resize()
  batteryChart?.resize()
  altitudeChangeChart?.resize()
  droneFlightsChart?.resize()
  droneDurationChart?.resize()
  droneAltitudeChart?.resize()
}

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  durationChart?.dispose()
  altitudeChart?.dispose()
  batteryChart?.dispose()
  altitudeChangeChart?.dispose()
  droneFlightsChart?.dispose()
  droneDurationChart?.dispose()
  droneAltitudeChart?.dispose()
})

// 监听数据变化，更新图表
watch(
  flightRecords,
  () => {
    updateCharts()
  },
  { deep: true }
)

// 监听无人机筛选变化，控制图表显示/隐藏
watch(
  droneFilter,
  (newValue) => {
    // 无论选择哪个无人机，都显示图表
    showCharts.value = true
    // 重新加载统计数据
    loadStatistics(newValue)
    // 延迟重新初始化图表，确保DOM已经渲染完成
    setTimeout(() => {
      initCharts()
    }, 100)
  }
)

// 导出为PDF
const exportToPDF = async () => {
  try {
    // 显示所有图表，以便导出时包含所有内容
    const originalShowCharts = showCharts.value
    showCharts.value = true
    
    // 确保图表已经渲染完成
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 获取要导出的内容
    const element = document.querySelector('.flight-data-container')
    if (!element) return
    
    // 使用html2canvas将内容转换为图片
    const canvas = await html2canvas(element, {
      scale: 2, // 提高清晰度
      useCORS: true, // 允许加载跨域图片
      logging: false
    })
    
    // 创建PDF
    const pdf = new jsPDF({
      orientation: 'landscape', // 横向
      unit: 'mm',
      format: 'a4'
    })
    
    // 计算PDF页面尺寸
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    // 计算图片尺寸，保持比例
    const imgWidth = pdfWidth - 20 // 左右边距
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    // 如果图片高度超过PDF页面高度，需要分页
    let heightLeft = imgHeight
    let position = 10 // 上边距
    
    // 添加第一张图片
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      10, // 左边距
      position,
      imgWidth,
      imgHeight
    )
    
    heightLeft -= pdfHeight - 20 // 减去页面高度和上下边距
    
    // 如果需要，添加更多页面
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        10,
        position,
        imgWidth,
        imgHeight
      )
      heightLeft -= pdfHeight - 20
    }
    
    // 导出PDF
    const droneName = droneFilter.value === 'all' ? '所有无人机' : getDroneName(parseInt(droneFilter.value))
    pdf.save(`${droneName}_飞行数据报表_${new Date().toISOString().slice(0, 10)}.pdf`)
    
    // 恢复原始状态
    showCharts.value = originalShowCharts
  } catch (error) {
    console.error('Failed to export PDF:', error)
  }
}
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

.header-buttons {
  display: flex;
  gap: 10px;
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

.export-button {
  padding: 8px 16px;
  background-color: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.export-button:hover {
  background-color: #73d13d;
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

/* 图表区域样式 */
.flight-data-charts {
  margin-bottom: 20px;
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.chart-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.chart-container h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.chart {
  width: 100%;
  height: 300px;
}

/* 工业化高级感样式 */
.chart-container {
  border-left: 4px solid #1890ff;
  transition: all 0.3s ease;
}

.chart-container:hover {
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.2);
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 1100px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
  
  .chart {
    height: 250px;
  }
}

@media (max-width: 768px) {
  .chart-container {
    padding: 12px;
  }
  
  .chart {
    height: 200px;
  }
}
</style>
