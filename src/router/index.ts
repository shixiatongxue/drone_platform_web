import { createRouter, createWebHistory } from 'vue-router'
import Drones from '../views/Drones.vue'
import Tasks from '../views/Tasks.vue'
import FlightData from '../views/FlightData.vue'
import Map3D from '../views/Map3D.vue'
import ControlMatrix from '../views/ControlMatrix.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/map3d'
    },
    {
      path: '/drones',
      name: 'drones',
      component: Drones
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: Tasks
    },
    {
      path: '/flight-data',
      name: 'flight-data',
      component: FlightData
    },
    {
      path: '/map3d',
      name: 'map3d',
      component: Map3D
    },
    {
      path: '/control-matrix',
      name: 'control-matrix',
      component: ControlMatrix
    }
  ]
})

export default router
