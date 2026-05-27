<template>
  <div class="home-container">
    <nav class="navbar">
      <div class="nav-brand">AiMe 智能</div>
      <div class="nav-links">
        <div class="lang-toggle">
          <button
            v-for="lang in ['id', 'en', 'zh']"
            :key="lang"
            class="lang-btn"
            :class="{ active: locale === lang }"
            @click="locale = lang"
          >
            {{ lang.toUpperCase() }}
          </button>
        </div>
        <a href="https://github.com/salman0812" target="_blank" class="github-link">
          {{ t('nav.github') }} <span class="arrow">↗</span>
        </a>
      </div>
    </nav>

    <div class="main-content">
      <section class="hero-section">
        <div class="hero-left">
          <div class="tag-row">
            <span class="orange-tag">{{ t('home.tag') }}</span>
            <span class="version-text">/ {{ t('home.version') }}</span>
          </div>
          <h1 class="main-title">
            {{ t('home.title1') }}<br>
            <span class="gradient-text">{{ t('home.title2') }}</span>
          </h1>
          <div class="hero-desc">
            <p>{{ t('home.desc1') }}</p>
            <p class="slogan-text">
              {{ t('home.slogan') }}<span class="blinking-cursor">_</span>
            </p>
          </div>
          <div class="decoration-square"></div>
        </div>
        <div class="hero-right">
          <div class="logo-container">
            <img src="/icon.png" alt="AiMe Logo" class="hero-logo" />
          </div>
          <button class="scroll-down-btn" @click="scrollToBottom">↓</button>
        </div>
      </section>

      <section class="dashboard-section">
        <div class="left-panel">
          <div class="panel-header">
            <span class="status-dot">■</span> {{ t('home.systemStatus') }}
          </div>
          <h2 class="section-title">{{ t('home.ready') }}</h2>
          <p class="section-desc">{{ t('home.readyDesc') }}</p>
          <div class="metrics-row">
            <div class="metric-card">
              <div class="metric-value">{{ t('home.lowCost') }}</div>
              <div class="metric-label">{{ t('home.lowCostDesc') }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{ t('home.highAvail') }}</div>
              <div class="metric-label">{{ t('home.highAvailDesc') }}</div>
            </div>
          </div>
          <div class="steps-container">
            <div class="steps-header">
              <span class="diamond-icon">◇</span> {{ t('home.workflow') }}
            </div>
            <div class="workflow-list">
              <div class="workflow-item" v-for="n in 5" :key="n">
                <span class="step-num">0{{ n }}</span>
                <div class="step-info">
                  <div class="step-title">{{ t(`home.step${n}Title`) }}</div>
                  <div class="step-desc">{{ t(`home.step${n}Desc`) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="right-panel">
          <div class="console-box">
            <div class="console-section">
              <div class="console-header">
                <span class="console-label">{{ t('home.seedLabel') }}</span>
                <span class="console-meta">{{ t('home.seedFormat') }}</span>
              </div>
              <div
                class="upload-zone"
                :class="{ 'drag-over': isDragOver, 'has-files': files.length > 0 }"
                @dragover.prevent="handleDragOver"
                @dragleave.prevent="handleDragLeave"
                @drop.prevent="handleDrop"
                @click="triggerFileInput"
              >
                <input ref="fileInput" type="file" multiple accept=".pdf,.md,.txt" @change="handleFileSelect" style="display: none" :disabled="loading" />
                <div v-if="files.length === 0" class="upload-placeholder">
                  <div class="upload-icon">↑</div>
                  <div class="upload-title">{{ t('home.uploadTitle') }}</div>
                  <div class="upload-hint">{{ t('home.uploadHint') }}</div>
                </div>
                <div v-else class="file-list">
                  <div v-for="(file, index) in files" :key="index" class="file-item">
                    <span class="file-icon">📄</span>
                    <span class="file-name">{{ file.name }}</span>
                    <button @click.stop="removeFile(index)" class="remove-btn">×</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="console-divider"><span>{{ t('home.inputParams') }}</span></div>

            <div class="console-section">
              <div class="console-header">
                <span class="console-label">{{ t('home.promptLabel') }}</span>
              </div>
              <div class="input-wrapper">
                <textarea v-model="formData.simulationRequirement" class="code-input" :placeholder="t('home.promptPlaceholder')" rows="6" :disabled="loading"></textarea>
                <div class="model-badge">{{ t('home.engine') }}</div>
              </div>
            </div>

            <div class="console-section btn-section">
              <button class="start-engine-btn" @click="startSimulation" :disabled="!canSubmit || loading">
                <span v-if="!loading">{{ t('home.startBtn') }}</span>
                <span v-else>{{ t('home.loading') }}</span>
                <span class="btn-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <HistoryDatabase />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import HistoryDatabase from '../components/HistoryDatabase.vue'

const { t, locale } = useI18n()
const router = useRouter()

const formData = ref({ simulationRequirement: '' })
const files = ref([])
const loading = ref(false)
const isDragOver = ref(false)
const fileInput = ref(null)

const canSubmit = computed(() => formData.value.simulationRequirement.trim() !== '' && files.value.length > 0)
const triggerFileInput = () => { if (!loading.value) fileInput.value?.click() }
const handleFileSelect = (e) => addFiles(Array.from(e.target.files))
const handleDragOver = () => { if (!loading.value) isDragOver.value = true }
const handleDragLeave = () => { isDragOver.value = false }
const handleDrop = (e) => { isDragOver.value = false; if (!loading.value) addFiles(Array.from(e.dataTransfer.files)) }
const addFiles = (newFiles) => { files.value.push(...newFiles.filter(f => ['pdf','md','txt'].includes(f.name.split('.').pop().toLowerCase()))) }
const removeFile = (i) => files.value.splice(i, 1)
const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })

const startSimulation = () => {
  if (!canSubmit.value || loading.value) return
  import('../store/pendingUpload.js').then(({ setPendingUpload }) => {
    setPendingUpload(files.value, formData.value.simulationRequirement)
    router.push({ name: 'Process', params: { projectId: 'new' } })
  })
}
</script>

<style scoped>
:root {
  --black: #000000; --white: #FFFFFF; --orange: #FF4500;
  --gray-light: #F5F5F5; --gray-text: #666666; --border: #E5E5E5;
  --font-mono: 'JetBrains Mono', monospace;
  --font-sans: 'Space Grotesk', 'Noto Sans SC', system-ui, sans-serif;
}
.home-container { min-height: 100vh; background: var(--white); font-family: var(--font-sans); color: var(--black); }
.navbar { height: 60px; background: var(--black); color: var(--white); display: flex; justify-content: space-between; align-items: center; padding: 0 40px; }
.nav-brand { font-family: var(--font-mono); font-weight: 800; letter-spacing: 1px; font-size: 1.2rem; }
.nav-links { display: flex; align-items: center; gap: 20px; }
.lang-toggle { display: flex; gap: 4px; background: rgba(255,255,255,0.1); padding: 4px; border-radius: 6px; }
.lang-btn { border: none; background: transparent; color: rgba(255,255,255,0.6); padding: 4px 10px; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; cursor: pointer; border-radius: 4px; transition: all 0.2s; }
.lang-btn.active { background: var(--orange); color: white; }
.github-link { color: var(--white); text-decoration: none; font-family: var(--font-mono); font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 8px; }
.main-content { max-width: 1400px; margin: 0 auto; padding: 60px 40px; }
.hero-section { display: flex; justify-content: space-between; margin-bottom: 80px; }
.hero-left { flex: 1; padding-right: 60px; }
.tag-row { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; font-family: var(--font-mono); font-size: 0.8rem; }
.orange-tag { background: var(--orange); color: var(--white); padding: 4px 10px; font-weight: 700; font-size: 0.75rem; }
.version-text { color: #999; }
.main-title { font-size: 4.5rem; line-height: 1.2; font-weight: 500; margin: 0 0 40px 0; letter-spacing: -2px; }
.gradient-text { background: linear-gradient(90deg, #000 0%, #444 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block; }
.hero-desc { font-size: 1.05rem; line-height: 1.8; color: var(--gray-text); max-width: 640px; margin-bottom: 50px; }
.slogan-text { font-size: 1.2rem; font-weight: 520; color: var(--black); border-left: 3px solid var(--orange); padding-left: 15px; margin-top: 20px; }
.blinking-cursor { color: var(--orange); animation: blink 1s step-end infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.decoration-square { width: 16px; height: 16px; background: var(--orange); }
.hero-right { flex: 0.8; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; }
.logo-container { width: 100%; display: flex; justify-content: flex-end; padding-right: 40px; }
.hero-logo { max-width: 500px; width: 100%; }
.scroll-down-btn { width: 40px; height: 40px; border: 1px solid var(--border); background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--orange); font-size: 1.2rem; }
.dashboard-section { display: flex; gap: 60px; border-top: 1px solid var(--border); padding-top: 60px; align-items: flex-start; }
.left-panel { flex: 0.8; }
.panel-header { font-family: var(--font-mono); font-size: 0.8rem; color: #999; display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
.status-dot { color: var(--orange); }
.section-title { font-size: 2rem; font-weight: 520; margin: 0 0 15px 0; }
.section-desc { color: var(--gray-text); margin-bottom: 25px; line-height: 1.6; }
.metrics-row { display: flex; gap: 20px; margin-bottom: 15px; }
.metric-card { border: 1px solid var(--border); padding: 20px 30px; min-width: 150px; }
.metric-value { font-family: var(--font-mono); font-size: 1.8rem; font-weight: 520; margin-bottom: 5px; }
.metric-label { font-size: 0.85rem; color: #999; }
.steps-container { border: 1px solid var(--border); padding: 30px; }
.steps-header { font-family: var(--font-mono); font-size: 0.8rem; color: #999; margin-bottom: 25px; display: flex; align-items: center; gap: 8px; }
.workflow-list { display: flex; flex-direction: column; gap: 20px; }
.workflow-item { display: flex; align-items: flex-start; gap: 20px; }
.step-num { font-family: var(--font-mono); font-weight: 700; color: var(--black); opacity: 0.3; }
.step-title { font-weight: 520; font-size: 1rem; margin-bottom: 4px; }
.step-desc { font-size: 0.85rem; color: var(--gray-text); }
.right-panel { flex: 1.2; }
.console-box { border: 1px solid #CCC; padding: 8px; }
.console-section { padding: 20px; }
.console-section.btn-section { padding-top: 0; }
.console-header { display: flex; justify-content: space-between; margin-bottom: 15px; font-family: var(--font-mono); font-size: 0.75rem; color: #666; }
.upload-zone { border: 1px dashed #CCC; height: 200px; overflow-y: auto; display: flex; align-items: center; justify-content: center; cursor: pointer; background: #FAFAFA; }
.upload-zone.has-files { align-items: flex-start; }
.upload-placeholder { text-align: center; }
.upload-icon { width: 40px; height: 40px; border: 1px solid #DDD; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; color: #999; }
.upload-title { font-weight: 500; font-size: 0.9rem; margin-bottom: 5px; }
.upload-hint { font-family: var(--font-mono); font-size: 0.75rem; color: #999; }
.file-list { width: 100%; padding: 15px; display: flex; flex-direction: column; gap: 10px; }
.file-item { display: flex; align-items: center; background: var(--white); padding: 8px 12px; border: 1px solid #EEE; font-family: var(--font-mono); font-size: 0.85rem; }
.file-name { flex: 1; margin: 0 10px; }
.remove-btn { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #999; }
.console-divider { display: flex; align-items: center; margin: 10px 0; }
.console-divider::before, .console-divider::after { content: ''; flex: 1; height: 1px; background: #EEE; }
.console-divider span { padding: 0 15px; font-family: var(--font-mono); font-size: 0.7rem; color: #BBB; }
.input-wrapper { position: relative; border: 1px solid #DDD; background: #FAFAFA; }
.code-input { width: 100%; border: none; background: transparent; padding: 20px; font-family: var(--font-mono); font-size: 0.9rem; line-height: 1.6; resize: vertical; outline: none; min-height: 150px; }
.model-badge { position: absolute; bottom: 10px; right: 15px; font-family: var(--font-mono); font-size: 0.7rem; color: #AAA; }
.start-engine-btn { width: 100%; background: var(--black); color: var(--white); border: none; padding: 20px; font-family: var(--font-mono); font-weight: 700; font-size: 1.1rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.3s; letter-spacing: 1px; }
.start-engine-btn:not(:disabled):hover { background: var(--orange); }
.start-engine-btn:disabled { background: #E5E5E5; color: #999; cursor: not-allowed; }
@media (max-width: 1024px) { .dashboard-section { flex-direction: column; } .hero-section { flex-direction: column; } .hero-left { padding-right: 0; margin-bottom: 40px; } .hero-logo { max-width: 200px; } }
</style>
