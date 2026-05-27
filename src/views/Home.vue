<template>
  <div class="home-container">
    <!-- Circuit board background -->
    <div class="circuit-bg"></div>

    <nav class="navbar">
      <div class="nav-brand">
        <img src="https://raw.githubusercontent.com/miro51/aimefrontend/master/public/icon.png" class="nav-logo" />
        <span class="brand-text">AiMe <span class="hanzi">智能</span></span>
      </div>
      <div class="nav-links">
        <div class="lang-toggle">
          <button v-for="lang in ['id', 'en', 'zh']" :key="lang" class="lang-btn" :class="{ active: locale === lang }" @click="locale = lang">
            {{ lang.toUpperCase() }}
          </button>
        </div>
        <a href="https://github.com/salman0812" target="_blank" class="github-link">
          {{ t('nav.github') }} <span>↗</span>
        </a>
        <button class="settings-btn" @click="goSettings">⚙ API Key</button>
      </div>
    </nav>

    <div class="main-content">
      <section class="hero-section">
        <div class="hero-left">
          <div class="tag-row">
            <span class="cyan-tag">{{ t('home.tag') }}</span>
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
            <div class="logo-glow"></div>
            <img src="https://raw.githubusercontent.com/miro51/aimefrontend/master/public/icon.png" alt="AiMe Logo" class="hero-logo" />
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
              <div class="upload-zone" :class="{ 'drag-over': isDragOver, 'has-files': files.length > 0 }"
                @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave"
                @drop.prevent="handleDrop" @click="triggerFileInput">
                <input ref="fileInput" type="file" multiple accept=".pdf,.md,.txt,.csv"
                  @change="handleFileSelect" style="display: none" :disabled="loading" />
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
                <textarea v-model="formData.simulationRequirement" class="code-input"
                  :placeholder="t('home.promptPlaceholder')" rows="6" :disabled="loading"></textarea>
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
const addFiles = (newFiles) => { files.value.push(...newFiles.filter(f => ['pdf','md','txt','csv'].includes(f.name.split('.').pop().toLowerCase()))) }
const removeFile = (i) => files.value.splice(i, 1)
const scrollToBottom = () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
const goSettings = () => router.push('/setup')

const startSimulation = () => {
  if (!canSubmit.value || loading.value) return
  import('../store/pendingUpload.js').then(({ setPendingUpload }) => {
    setPendingUpload(files.value, formData.value.simulationRequirement)
    router.push({ name: 'Process', params: { projectId: 'new' } })
  })
}
</script>

<style scoped>
* { box-sizing: border-box; }

.home-container {
  min-height: 100vh;
  background: #050d13;
  font-family: 'Space Grotesk', 'Noto Sans SC', system-ui, sans-serif;
  color: #fff;
  position: relative;
  overflow-x: hidden;
}

.circuit-bg {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0,255,200,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,255,200,0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
}

.navbar {
  position: relative;
  z-index: 10;
  height: 64px;
  background: rgba(5,13,19,0.95);
  border-bottom: 1px solid rgba(0,255,200,0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  backdrop-filter: blur(10px);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.brand-text {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 800;
  font-size: 1.2rem;
  color: #fff;
  letter-spacing: 1px;
}

.hanzi { color: #C9A84C; }

.nav-links {
  display: flex;
  align-items: center;
  gap: 16px;
}

.lang-toggle {
  display: flex;
  gap: 4px;
  background: rgba(0,255,200,0.05);
  padding: 4px;
  border-radius: 6px;
  border: 1px solid rgba(0,255,200,0.1);
}

.lang-btn {
  border: none;
  background: transparent;
  color: rgba(0,255,200,0.5);
  padding: 4px 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.lang-btn.active {
  background: rgba(0,255,200,0.15);
  color: #00ffcc;
}

.github-link {
  color: rgba(0,255,200,0.7);
  text-decoration: none;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
}

.github-link:hover { color: #00ffcc; }

.settings-btn {
  background: rgba(201,168,76,0.1);
  border: 1px solid rgba(201,168,76,0.3);
  color: #C9A84C;
  padding: 6px 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.settings-btn:hover {
  background: rgba(201,168,76,0.2);
  border-color: #C9A84C;
}

.main-content {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 60px 40px;
}

.hero-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 80px;
  align-items: center;
}

.hero-left { flex: 1; padding-right: 60px; }

.tag-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
}

.cyan-tag {
  background: rgba(0,255,200,0.1);
  border: 1px solid rgba(0,255,200,0.3);
  color: #00ffcc;
  padding: 4px 12px;
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 1px;
}

.version-text { color: rgba(255,255,255,0.3); }

.main-title {
  font-size: 4rem;
  line-height: 1.2;
  font-weight: 600;
  margin: 0 0 40px 0;
  letter-spacing: -2px;
  color: #fff;
}

.gradient-text {
  background: linear-gradient(90deg, #00ffcc, #C9A84C);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-desc {
  font-size: 1rem;
  line-height: 1.8;
  color: rgba(255,255,255,0.5);
  max-width: 600px;
  margin-bottom: 40px;
}

.slogan-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(255,255,255,0.8);
  border-left: 3px solid #00ffcc;
  padding-left: 15px;
  margin-top: 20px;
}

.blinking-cursor {
  color: #00ffcc;
  animation: blink 1s step-end infinite;
}

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

.decoration-square {
  width: 16px;
  height: 16px;
  background: #C9A84C;
  box-shadow: 0 0 10px #C9A84C;
}

.hero-right {
  flex: 0.8;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
}

.logo-container {
  position: relative;
  display: flex;
  justify-content: flex-end;
}

.logo-glow {
  position: absolute;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(0,255,200,0.1) 0%, transparent 70%);
  border-radius: 50%;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
}

.hero-logo {
  max-width: 400px;
  width: 100%;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 0 20px rgba(0,255,200,0.3));
}

.scroll-down-btn {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(0,255,200,0.3);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #00ffcc;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.scroll-down-btn:hover {
  border-color: #00ffcc;
  box-shadow: 0 0 10px rgba(0,255,200,0.3);
}

.dashboard-section {
  display: flex;
  gap: 60px;
  border-top: 1px solid rgba(0,255,200,0.1);
  padding-top: 60px;
  align-items: flex-start;
}

.left-panel { flex: 0.8; }

.panel-header {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: rgba(0,255,200,0.5);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.status-dot { color: #00ffcc; }

.section-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #fff;
}

.section-desc {
  color: rgba(255,255,255,0.4);
  margin-bottom: 25px;
  line-height: 1.6;
}

.metrics-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.metric-card {
  border: 1px solid rgba(0,255,200,0.15);
  background: rgba(0,255,200,0.03);
  padding: 16px 24px;
  min-width: 140px;
}

.metric-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.4rem;
  font-weight: 700;
  color: #00ffcc;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.4);
}

.steps-container {
  border: 1px solid rgba(0,255,200,0.1);
  background: rgba(0,255,200,0.02);
  padding: 24px;
}

.steps-header {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: rgba(0,255,200,0.5);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.workflow-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workflow-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.step-num {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: rgba(0,255,200,0.3);
  min-width: 24px;
}

.step-title {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 2px;
  color: #fff;
}

.step-desc {
  font-size: 0.82rem;
  color: rgba(255,255,255,0.4);
}

.right-panel { flex: 1.2; }

.console-box {
  border: 1px solid rgba(0,255,200,0.2);
  background: rgba(0,255,200,0.02);
  padding: 8px;
}

.console-section { padding: 16px; }
.console-section.btn-section { padding-top: 0; }

.console-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: rgba(0,255,200,0.6);
}

.upload-zone {
  border: 1px dashed rgba(0,255,200,0.2);
  height: 180px;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(0,0,0,0.3);
}

.upload-zone.has-files { align-items: flex-start; }
.upload-zone:hover, .upload-zone.drag-over {
  border-color: #00ffcc;
  background: rgba(0,255,200,0.05);
  box-shadow: 0 0 20px rgba(0,255,200,0.1);
}

.upload-placeholder { text-align: center; }

.upload-icon {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(0,255,200,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  color: #00ffcc;
}

.upload-title {
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 4px;
  color: rgba(255,255,255,0.7);
}

.upload-hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  color: rgba(255,255,255,0.3);
}

.file-list {
  width: 100%;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  background: rgba(0,255,200,0.05);
  padding: 6px 10px;
  border: 1px solid rgba(0,255,200,0.1);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: #fff;
}

.file-name { flex: 1; margin: 0 8px; }

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  color: rgba(255,100,100,0.7);
}

.console-divider {
  display: flex;
  align-items: center;
  margin: 8px 0;
}

.console-divider::before, .console-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(0,255,200,0.1);
}

.console-divider span {
  padding: 0 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  color: rgba(0,255,200,0.3);
  letter-spacing: 1px;
}

.input-wrapper {
  position: relative;
  border: 1px solid rgba(0,255,200,0.15);
  background: rgba(0,0,0,0.3);
}

.code-input {
  width: 100%;
  border: none;
  background: transparent;
  padding: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  min-height: 140px;
  color: #fff;
}

.code-input::placeholder { color: rgba(255,255,255,0.2); }

.model-badge {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.68rem;
  color: rgba(0,255,200,0.4);
}

.start-engine-btn {
  width: 100%;
  background: rgba(0,255,200,0.08);
  color: #00ffcc;
  border: 1px solid rgba(0,255,200,0.3);
  padding: 18px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  letter-spacing: 1px;
}

.start-engine-btn:not(:disabled):hover {
  background: rgba(0,255,200,0.15);
  border-color: #00ffcc;
  box-shadow: 0 0 20px rgba(0,255,200,0.2);
}

.start-engine-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .dashboard-section { flex-direction: column; }
  .hero-section { flex-direction: column; }
  .hero-left { padding-right: 0; margin-bottom: 40px; }
  .hero-logo { max-width: 200px; }
}
</style>
