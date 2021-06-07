import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

import $ from 'jquery'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap/dist/js/bootstrap.min.js'
import 'bootstrap/dist/css/bootstrap.min.css'

import './assets/iconfont/iconfont.css'

import '../static/jquery.range'
import '../static/jquery.range.css'

// import { BootstrapVue,IconsPlugin} from 'bootstrap-vue'
// import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
// Vue.use(BootstrapVue)
// Vue.use(IconsPlugin)

const app = createApp(App)
app.use(store).use(router).mount('#app')