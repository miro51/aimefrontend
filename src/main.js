import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createI18n } from 'vue-i18n'
import zh from './locales/zh.json'
import id from './locales/id.json'
import en from './locales/en.json'

const i18n = createI18n({
  legacy: false,
  locale: 'id',
  fallbackLocale: 'en',
  messages: { zh, id, en }
})

const app = createApp(App)
app.use(router)
app.use(i18n)
app.mount('#app')
