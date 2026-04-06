const API_BASE_URL = '/api';

// 通用请求方法
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

// 无人机相关API
export const droneAPI = {
  getDrones: () => request<Drone[]>('/drones'),
  getDrone: (id: string) => request<Drone>(`/drones/${id}`),
  createDrone: (drone: Omit<Drone, 'id'>) => request<Drone>('/drones', {
    method: 'POST',
    body: JSON.stringify(drone),
  }),
  updateDrone: (id: string, drone: Partial<Drone>) => request<Drone>(`/drones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(drone),
  }),
  deleteDrone: (id: string) => request<void>(`/drones/${id}`, {
    method: 'DELETE',
  }),
  getOnlineDrones: () => request<Drone[]>('/drones/online'),
};

// 任务相关API
export const taskAPI = {
  getTasks: () => request<Task[]>('/tasks'),
  getTask: (id: string) => request<Task>(`/tasks/${id}`),
  createTask: (task: Omit<Task, 'id'>) => request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  }),
  updateTask: (id: string, task: Partial<Task>) => request<Task>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(task),
  }),
  updateTaskStatus: (id: string, status: string) => request<Task>(`/tasks/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(status),
  }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, {
    method: 'DELETE',
  }),
  getTasksByDroneId: (droneId: string) => request<Task[]>(`/tasks/drone/${droneId}`),
  getTasksByStatus: (status: string) => request<Task[]>(`/tasks/status/${status}`),
};

// 飞行数据相关API
export const flightDataAPI = {
  getFlightRecords: () => request<FlightRecord[]>('/flight-data'),
  getFlightRecord: (id: string) => request<FlightRecord>(`/flight-data/${id}`),
  createFlightRecord: (record: Omit<FlightRecord, 'id'>) => request<FlightRecord>('/flight-data', {
    method: 'POST',
    body: JSON.stringify(record),
  }),
  updateFlightRecord: (id: string, record: Partial<FlightRecord>) => request<FlightRecord>(`/flight-data/${id}`, {
    method: 'PUT',
    body: JSON.stringify(record),
  }),
  deleteFlightRecord: (id: string) => request<void>(`/flight-data/${id}`, {
    method: 'DELETE',
  }),
  getFlightRecordsByDroneId: (droneId: string) => request<FlightRecord[]>(`/flight-data/drone/${droneId}`),
  getFlightStatistics: () => request<FlightStatistics>('/flight-data/statistics'),
};

// 用户相关API
export const userAPI = {
  getUsers: () => request<User[]>('/users'),
  getUser: (id: string) => request<User>(`/users/${id}`),
  createUser: (user: Omit<User, 'id'>) => request<User>('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  }),
  updateUser: (id: string, user: Partial<User>) => request<User>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  }),
  updatePassword: (id: string, newPassword: string) => request<User>(`/users/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify(newPassword),
  }),
  deleteUser: (id: string) => request<void>(`/users/${id}`, {
    method: 'DELETE',
  }),
  getUsersByRole: (role: string) => request<User[]>(`/users/role/${role}`),
};

// 类型定义
export interface Drone {
  id: string;
  name: string;
  model: string;
  status: 'online' | 'offline' | 'flying';
  battery: number;
  location: string;
  lastActivity: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  drone: string;
  template?: string;
  startTime?: string;
  endTime?: string;
  route?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlightRecord {
  id: string;
  drone: string;
  startTime: string;
  endTime?: string;
  duration: string;
  maxAltitude: number;
  maxSpeed: number;
  batteryConsumption: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlightStatistics {
  totalFlights: number;
  totalDuration: number;
  maxAltitude: number;
  maxSpeed: number;
  avgBatteryConsumption: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'operator' | 'viewer';
  email: string;
  name: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}
