<template>
  <div class="main-view">
    <header class="app-header">
      <div class="header-left">
        <img src="/icon.png" class="header-logo" />
        <div class="brand" @click="router.push('/')">AiMe <span class="hanzi">智能</span></div>
      </div>
      <div class="header-center">
        <div class="view-switcher">
          <button v-for="mode in ['graph', 'split', 'workbench']" :key="mode"
            class="switch-btn" :class="{ active: viewMode === mode }" @click="viewMode = mode">
            {{ t(`mainView.${mode}`) }}
          </button>
        </div>
      </div>
      <div class="header-right">
        <div class="lang-toggle">
          <button v-for="lang in ['id', 'en', 'zh']" :key="lang"
            class="lang-btn" :class="{ active: locale === lang }" @click="locale = lang">
            {{ lang.toUpperCase() }}
          </button>
        </div>
        <div class="workflow-step">
          <span class="step-num">Step {{ currentStep }}/5</span>
          <span class="step-name">{{ t(`mainView.step${currentStep}`) }}</span>
        </div>
        <div class="step-divider"></div>
        <span class="status-indicator" :class="statusClass">
          <span class="dot"></span>
          {{ statusText }}
        </span>
      </div>
    </header>

    <main class="content-area">
      <div class="panel-wrapper left" :style="leftPanelStyle">
        <GraphPanel :graphData="graphData" :loading="graphLoading" :currentPhase="currentPhase"
          @refresh="refreshGraph" @toggle-maximize="toggleMaximize('graph')" />
      </div>
      <div class="panel-wrapper right" :style="rightPanelStyle">
        <Step1GraphBuild v-if="currentStep === 1" :currentPhase="currentPhase"
          :projectData="projectData" :ontologyProgress="ontologyProgress"
          :buildProgress="buildProgress" :graphData="graphData" :systemLogs="systemLogs"
          @next-step="handleNextStep" />
        <Step2EnvSetup v-else-if="currentStep === 2" :projectData="projectData"
          :graphData="graphData" :systemLogs="systemLogs"
          @go-back="handleGoBack" @next-step="handleNextStep" @add-log="addLog" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import GraphPanel from '../components/GraphPanel.vue'
import Step1GraphBuild from '../components/Step1GraphBuild.vue'
import Step2EnvSetup from '../components/Step2EnvSetup.vue'
import { generateOntology, getProject, buildGraph, getTaskStatus, getGraphData } from '../api/graph'
import { getPendingUpload, clearPendingUpload } from '../store/pendingUpload'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const viewMode = ref('split')
const currentStep = ref(1)
const currentProjectId = ref(route.params.projectId)
const loading = ref(false)
const graphLoading = ref(false)
const error = ref('')
const projectData = ref(null)
const graphData = ref(null)
const currentPhase = ref(-1)
const ontologyProgress = ref(null)
const buildProgress = ref(null)
const systemLogs = ref([])
let pollTimer = null
let graphPollTimer = null

const leftPanelStyle = computed(() => {
  if (viewMode.value === 'graph') return { width: '100%', opacity: 1, transform: 'translateX(0)' }
  if (viewMode.value === 'workbench') return { width: '0%', opacity: 0, transform: 'translateX(-20px)' }
  return { width: '50%', opacity: 1, transform: 'translateX(0)' }
})

const rightPanelStyle = computed(() => {
  if (viewMode.value === 'workbench') return { width: '100%', opacity: 1, transform: 'translateX(0)' }
  if (viewMode.value === 'graph') return { width: '0%', opacity: 0, transform: 'translateX(20px)' }
  return { width: '50%', opacity: 1, transform: 'translateX(0)' }
})

const statusClass = computed(() => { if (error.value) return 'error'; if (currentPhase.value >= 2) return 'completed'; return 'processing' })
const statusText = computed(() => { if (error.value) return 'Error'; if (currentPhase.value >= 2) return 'Ready'; if (currentPhase.value === 1) return 'Building Graph'; if (currentPhase.value === 0) return 'Generating Ontology'; return 'Initializing' })

const addLog = (msg) => {
  const time = new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + new Date().getMilliseconds().toString().padStart(3, '0')
  systemLogs.value.push({ time, msg })
  if (systemLogs.value.length > 100) systemLogs.value.shift()
}

const toggleMaximize = (target) => { viewMode.value = viewMode.value === target ? 'split' : target }
const handleNextStep = (params = {}) => { if (currentStep.value < 5) { currentStep.value++; addLog(`Step ${currentStep.value}`) } }
const handleGoBack = () => { if (currentStep.value > 1) { currentStep.value--; addLog(`Back to Step ${currentStep.value}`) } }

const initProject = async () => {
  addLog('Project initialized.')
  if (currentProjectId.value === 'new') await handleNewProject()
  else await loadProject()
}

const handleNewProject = async () => {
  const pending = getPendingUpload()
  if (!pending.isPending || pending.files.length === 0) { error.value = 'No pending files found.'; return }
  try {
    loading.value = true; currentPhase.value = 0
    ontologyProgress.value = { message: 'Uploading...' }
    addLog('Starting ontology generation...')
    const formData = new FormData()
    pending.files.forEach(f => formData.append('files', f))
    formData.append('simulation_requirement', pending.simulationRequirement)
    const res = await generateOntology(formData)
    if (res.success) {
      clearPendingUpload(); currentProjectId.value = res.data.project_id; projectData.value = res.data
      router.replace({ name: 'Process', params: { projectId: res.data.project_id } })
      ontologyProgress.value = null; addLog(`Project: ${res.data.project_id}`)
      await startBuildGraph()
    } else { error.value = res.error; addLog(`Error: ${error.value}`) }
  } catch (err) { error.value = err.message; addLog(`Exception: ${err.message}`) }
  finally { loading.value = false }
}

const loadProject = async () => {
  try {
    loading.value = true; addLog(`Loading project ${currentProjectId.value}...`)
    const res = await getProject(currentProjectId.value)
    if (res.success) {
      projectData.value = res.data; updatePhaseByStatus(res.data.status)
      if (res.data.status === 'ontology_generated' && !res.data.graph_id) await startBuildGraph()
      else if (res.data.status === 'graph_building' && res.data.graph_build_task_id) { currentPhase.value = 1; startPollingTask(res.data.graph_build_task_id); startGraphPolling() }
      else if (res.data.status === 'graph_completed' && res.data.graph_id) { currentPhase.value = 2; await loadGraph(res.data.graph_id) }
    } else { error.value = res.error }
  } catch (err) { error.value = err.message }
  finally { loading.value = false }
}

const updatePhaseByStatus = (status) => {
  const map = { created: 0, ontology_generated: 0, graph_building: 1, graph_completed: 2 }
  currentPhase.value = map[status] ?? -1
  if (status === 'failed') error.value = 'Project failed'
}

const startBuildGraph = async () => {
  try {
    currentPhase.value = 1; buildProgress.value = { progress: 0, message: 'Starting...' }
    const res = await buildGraph({ project_id: currentProjectId.value })
    if (res.success) { startGraphPolling(); startPollingTask(res.data.task_id) }
    else { error.value = res.error }
  } catch (err) { error.value = err.message }
}

const startGraphPolling = () => { fetchGraphData(); graphPollTimer = setInterval(fetchGraphData, 10000) }
const fetchGraphData = async () => {
  try {
    const projRes = await getProject(currentProjectId.value)
    if (projRes.success && projRes.data.graph_id) {
      const gRes = await getGraphData(projRes.data.graph_id)
      if (gRes.success) { graphData.value = gRes.data }
    }
  } catch (err) { console.warn(err) }
}

const startPollingTask = (taskId) => { pollTaskStatus(taskId); pollTimer = setInterval(() => pollTaskStatus(taskId), 2000) }
const pollTaskStatus = async (taskId) => {
  try {
    const res = await getTaskStatus(taskId)
    if (res.success) {
      const task = res.data
      buildProgress.value = { progress: task.progress || 0, message: task.message }
      if (task.status === 'completed') {
        stopPolling(); stopGraphPolling(); currentPhase.value = 2
        const projRes = await getProject(currentProjectId.value)
        if (projRes.success && projRes.data.graph_id) { projectData.value = projRes.data; await loadGraph(projRes.data.graph_id) }
      } else if (task.status === 'failed') { stopPolling(); error.value = task.error }
    }
  } catch (e) { console.error(e) }
}

const loadGraph = async (graphId) => {
  graphLoading.value = true
  try {
    const res = await getGraphData(graphId)
    if (res.success) { graphData.value = res.data }
  } catch (e) { addLog(`Error: ${e.message}`) }
  finally { graphLoading.value = false }
}

const refreshGraph = () => { if (projectData.value?.graph_id) loadGraph(projectData.value.graph_id) }
const stopPolling = () => { if (pollTimer) { clearInterval(pollTimer); pollTimer = null } }
const stopGraphPolling = () => { if (graphPollTimer) { clearInterval(graphPollTimer); graphPollTimer = null } }

onMounted(() => initProject())
onUnmounted(() => { stopPolling(); stopGraphPolling() })
</script>

<style scoped>
.main-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #050d13;
  overflow: hidden;
  font-family: 'Space Grotesk', sans-serif;
}

.app-header {
  height: 60px;
  border-bottom: 1px solid rgba(0,255,200,0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(5,13,19,0.98);
  z-index: 100;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.brand {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 800;
  font-size: 16px;
  letter-spacing: 1px;
  cursor: pointer;
  color: #fff;
}

.hanzi { color: #C9A84C; }

.view-switcher {
  display: flex;
  background: rgba(0,255,200,0.05);
  padding: 3px;
  border-radius: 6px;
  gap: 2px;
  border: 1px solid rgba(0,255,200,0.1);
}

.switch-btn {
  border: none;
  background: transparent;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(0,255,200,0.4);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.switch-btn.active {
  background: rgba(0,255,200,0.15);
  color: #00ffcc;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lang-toggle {
  display: flex;
  gap: 2px;
  background: rgba(0,255,200,0.05);
  padding: 3px;
  border-radius: 6px;
  border: 1px solid rgba(0,255,200,0.1);
}

.lang-btn {
  border: none;
  background: transparent;
  color: rgba(0,255,200,0.4);
  padding: 3px 8px;
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

.workflow-step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.step-num {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: rgba(0,255,200,0.4);
}

.step-name {
  font-weight: 700;
  color: #fff;
}

.step-divider {
  width: 1px;
  height: 14px;
  background: rgba(0,255,200,0.15);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(0,255,200,0.3);
}

.status-indicator.processing .dot {
  background: #00ffcc;
  animation: pulse 1s infinite;
  box-shadow: 0 0 6px #00ffcc;
}

.status-indicator.completed .dot {
  background: #C9A84C;
  box-shadow: 0 0 6px #C9A84C;
}

.status-indicator.error .dot { background: #ff4444; }

@keyframes pulse { 50% { opacity: 0.4; } }

.content-area {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

.panel-wrapper {
  height: 100%;
  overflow: hidden;
  transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease, transform 0.3s ease;
}

.panel-wrapper.left {
  border-right: 1px solid rgba(0,255,200,0.1);
}
</style>
