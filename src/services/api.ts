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

  // 对于204 No Content响应，直接返回undefined
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// 无人机相关API
export const droneAPI = {
  getDrones: () => request<Drone[]>('/drones'),
  getDrone: (id: number) => request<Drone>(`/drones/${id}`),
  createDrone: (drone: Omit<Drone, 'id'>) => request<Drone>('/drones', {
    method: 'POST',
    body: JSON.stringify(drone),
  }),
  updateDrone: (id: number, drone: Partial<Drone>) => request<Drone>(`/drones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(drone),
  }),
  deleteDrone: (id: number) => request<void>(`/drones/${id}`, {
    method: 'DELETE',
  }),
  getOnlineDrones: () => request<Drone[]>('/drones/online'),
};

// 任务相关API
export const taskAPI = {
  getTasks: () => request<Task[]>('/tasks'),
  getTask: (id: number) => request<Task>(`/tasks/${id}`),
  createTask: (task: Omit<Task, 'id'>) => request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  }),
  updateTask: (id: number, task: Partial<Task>) => request<Task>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(task),
  }),
  updateTaskStatus: (id: number, status: string) => request<Task>(`/tasks/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(status),
  }),
  deleteTask: (id: number) => request<void>(`/tasks/${id}`, {
    method: 'DELETE',
  }),
  getTasksByDroneId: (droneId: number) => request<Task[]>(`/tasks/drone/${droneId}`),
  getTasksByStatus: (status: string) => request<Task[]>(`/tasks/status/${status}`),
};

// 飞行数据相关API
export const flightDataAPI = {
  getFlightRecords: () => request<FlightRecord[]>('/flight-data'),
  getFlightRecord: (id: number) => request<FlightRecord>(`/flight-data/${id}`),
  createFlightRecord: (record: Omit<FlightRecord, 'id'>) => request<FlightRecord>('/flight-data', {
    method: 'POST',
    body: JSON.stringify(record),
  }),
  updateFlightRecord: (id: number, record: Partial<FlightRecord>) => request<FlightRecord>(`/flight-data/${id}`, {
    method: 'PUT',
    body: JSON.stringify(record),
  }),
  deleteFlightRecord: (id: number) => request<void>(`/flight-data/${id}`, {
    method: 'DELETE',
  }),
  getFlightRecordsByDroneId: (droneId: number) => request<FlightRecord[]>(`/flight-data/drone/${droneId}`),
  getFlightStatistics: () => request<FlightStatistics>('/flight-data/statistics'),
};

// 用户相关API
export const userAPI = {
  getUsers: () => request<User[]>('/users'),
  getUser: (id: number) => request<User>(`/users/${id}`),
  createUser: (user: Omit<User, 'id'>) => request<User>('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  }),
  updateUser: (id: number, user: Partial<User>) => request<User>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  }),
  updatePassword: (id: number, newPassword: string) => request<User>(`/users/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify(newPassword),
  }),
  deleteUser: (id: number) => request<void>(`/users/${id}`, {
    method: 'DELETE',
  }),
  getUsersByRole: (role: string) => request<User[]>(`/users/role/${role}`),
  login: (username: string, password: string) => request<{ message: string; user: User }>('/users/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
};

// 航线相关API
export const routeAPI = {
  getRoutes: () => request<Route[]>('/routes'),
  getRoute: (id: number) => request<Route>(`/routes/${id}`),
  createRoute: (route: Omit<Route, 'id'>) => request<Route>('/routes', {
    method: 'POST',
    body: JSON.stringify(route),
  }),
  updateRoute: (id: number, route: Partial<Route>) => request<Route>(`/routes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(route),
  }),
  deleteRoute: (id: number) => request<void>(`/routes/${id}`, {
    method: 'DELETE',
  }),
  getRoutesByDroneId: (droneId: number) => request<Route[]>(`/routes/drone/${droneId}`),
};

// 视频相关API
export const videoAPI = {
  getVideos: () => request<Video[]>('/videos'),
  getVideo: (id: number) => request<Video>(`/videos/${id}`),
  createVideo: (video: Omit<Video, 'id'>) => request<Video>('/videos', {
    method: 'POST',
    body: JSON.stringify(video),
  }),
  updateVideo: (id: number, video: Partial<Video>) => request<Video>(`/videos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(video),
  }),
  deleteVideo: (id: number) => request<void>(`/videos/${id}`, {
    method: 'DELETE',
  }),
  getVideosByDroneId: (droneId: number) => request<Video[]>(`/videos/drone/${droneId}`),
  getVideosByTimeRange: (droneId: number, startTime: string, endTime: string) => request<Video[]>(`/videos/drone/${droneId}/time-range`, {
    method: 'POST',
    body: JSON.stringify({ startTime, endTime }),
  }),
};

// 照片相关API
export const photoAPI = {
  getPhotos: () => request<Photo[]>('/photos'),
  getPhoto: (id: number) => request<Photo>(`/photos/${id}`),
  createPhoto: (photo: Omit<Photo, 'id'>) => request<Photo>('/photos', {
    method: 'POST',
    body: JSON.stringify(photo),
  }),
  updatePhoto: (id: number, photo: Partial<Photo>) => request<Photo>(`/photos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(photo),
  }),
  deletePhoto: (id: number) => request<void>(`/photos/${id}`, {
    method: 'DELETE',
  }),
  getPhotosByDroneId: (droneId: number) => request<Photo[]>(`/photos/drone/${droneId}`),
  getPhotosByTimeRange: (droneId: number, startTime: string, endTime: string) => request<Photo[]>(`/photos/drone/${droneId}/time-range`, {
    method: 'POST',
    body: JSON.stringify({ startTime, endTime }),
  }),
};

// 类型定义
export interface Drone {
  id: number;
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
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  drone: number;
  template?: number;
  startTime?: string;
  endTime?: string;
  route?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlightRecord {
  id: number;
  drone: number;
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
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'operator' | 'viewer';
  email: string;
  name: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Route {
  id: number;
  name: string;
  description: string;
  waypoints: string;
  droneId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Video {
  id: number;
  title: string;
  description: string;
  filePath: string;
  duration: number;
  droneId: number;
  recordingStartTime: string;
  recordingEndTime: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Photo {
  id: number;
  title: string;
  description: string;
  filePath: string;
  droneId: number;
  captureTime: string;
  createdAt?: string;
  updatedAt?: string;
}

// 重点巡防区域相关API
export const patrolAreaAPI = {
  getPatrolAreas: () => request<PatrolArea[]>('/patrol-areas'),
  getPatrolArea: (id: number) => request<PatrolArea>(`/patrol-areas/${id}`),
  searchPatrolAreas: (keyword: string, district: string) => request<PatrolArea[]>(`/patrol-areas/search?keyword=${keyword}&district=${district}`),
  createPatrolArea: (patrolArea: Omit<PatrolArea, 'id'>) => request<PatrolArea>('/patrol-areas', {
    method: 'POST',
    body: JSON.stringify(patrolArea),
  }),
  updatePatrolArea: (id: number, patrolArea: Partial<PatrolArea>) => request<PatrolArea>(`/patrol-areas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patrolArea),
  }),
  deletePatrolArea: (id: number) => request<void>(`/patrol-areas/${id}`, {
    method: 'DELETE',
  }),
};

// AI事件相关API
export const aiEventsAPI = {
  getAIEvents: () => request<AIEvents[]>('/ai-events'),
  getAIEventsById: (id: number) => request<AIEvents>(`/ai-events/${id}`),
  getAIEventsByDroneId: (droneId: number) => request<AIEvents[]>(`/ai-events/drone/${droneId}`),
  searchAIEvents: (params: {
    droneId?: number,
    eventType?: string,
    startDate?: string,
    endDate?: string
  }) => request<AIEvents[]>('/ai-events/search', {
    method: 'POST',
    body: JSON.stringify(params),
  }),
  createAIEvents: (aiEvents: Omit<AIEvents, 'id'>) => request<AIEvents>('/ai-events', {
    method: 'POST',
    body: JSON.stringify(aiEvents),
  }),
  updateAIEvents: (id: number, aiEvents: Partial<AIEvents>) => request<AIEvents>(`/ai-events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(aiEvents),
  }),
  deleteAIEvents: (id: number) => request<void>(`/ai-events/${id}`, {
    method: 'DELETE',
  }),
};

// 重点巡防区域类型定义
export interface PatrolArea {
  id: number;
  name: string;
  description: string;
  boundary: string;
  district: string;
  importanceLevel: string;
  createdAt?: string;
  updatedAt?: string;
}

// AI事件类型定义
export interface AIEvents {
  id: number;
  droneId: number;
  eventType: string;
  eventTime: string;
  location: string;
  description: string;
  evidenceUrl: string;
  status: string;
  reportGenerated: boolean;
  createdAt?: string;
  updatedAt?: string;
}
