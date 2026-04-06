import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import * as AntIcons from '@ant-design/icons-vue'
import 'ant-design-vue/dist/reset.css'

const app = createApp(App)
app.use(router)
app.use(Antd)

// 注册所有图标组件
for (const [key, component] of Object.entries(AntIcons)) {
  app.component(key, component)
}

app.mount('#app')
