<template>
  <div class="onboarding">
    <div class="onboarding-card">
      <div class="logo-section">
        <img src="/icon.png" alt="AiMe" class="logo" />
        <h1>AiMe <span class="hanzi">智能</span></h1>
        <p class="subtitle">AI Prediction & Simulation Engine</p>
      </div>

      <div class="form-section">
        <div class="field">
          <label>Groq API Key</label>
          <div class="input-wrapper">
            <input
              :type="showKey ? 'text' : 'password'"
              v-model="apiKey"
              placeholder="gsk_..."
              class="input"
            />
            <button class="toggle-btn" @click="showKey = !showKey">
              {{ showKey ? '🙈' : '👁️' }}
            </button>
          </div>
          <span class="hint">Gratis di <a href="https://console.groq.com" target="_blank">console.groq.com</a></span>
        </div>

        <div class="field">
          <label>Model</label>
          <select v-model="model" class="input">
            <option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout 17B (Recommended)</option>
            <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
            <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Fast)</option>
            <option value="qwen/qwen3-32b">Qwen 3 32B</option>
            <option value="openai/gpt-oss-120b">GPT OSS 120B</option>
          </select>
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <button class="start-btn" @click="handleStart" :disabled="loading">
          <span v-if="!loading">Mulai Simulasi →</span>
          <span v-else>Memverifikasi...</span>
        </button>

        <p class="privacy-note">🔒 API Key disimpan lokal di browser — tidak dikirim ke server kami</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const apiKey = ref('')
const model = ref('meta-llama/llama-4-scout-17b-16e-instruct')
const showKey = ref(false)
const loading = ref(false)
const error = ref('')

const handleStart = async () => {
  if (!apiKey.value.trim()) {
    error.value = 'API Key wajib diisi!'
    return
  }
  loading.value = true
  error.value = ''

  try {
    // Verifikasi API key dengan test call ke Groq
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: model.value,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey.value}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (res.data.choices) {
      // Simpan ke localStorage
      localStorage.setItem('aime_credentials', JSON.stringify({
        apiKey: apiKey.value,
        model: model.value
      }))
      router.push('/')
    }
  } catch (e) {
    if (e.response?.status === 401) {
      error.value = 'API Key tidak valid!'
    } else if (e.response?.status === 429) {
      error.value = 'Rate limit — coba lagi dalam 1 menit'
    } else {
      error.value = 'Gagal verifikasi: ' + (e.response?.data?.error?.message || e.message)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.onboarding {
  min-height: 100vh;
  background: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Grotesk', sans-serif;
}

.onboarding-card {
  background: #111;
  border: 1px solid #222;
  padding: 48px;
  width: 100%;
  max-width: 480px;
  border-radius: 2px;
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 16px;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px;
}

.hanzi {
  color: #C9A84C;
}

.subtitle {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #999;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.input-wrapper {
  position: relative;
}

.input {
  width: 100%;
  background: #0a0a0a;
  border: 1px solid #333;
  color: #fff;
  padding: 12px 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
  border-radius: 2px;
}

.input:focus {
  border-color: #C9A84C;
}

select.input {
  cursor: pointer;
}

.toggle-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.hint {
  font-size: 0.75rem;
  color: #555;
}

.hint a {
  color: #C9A84C;
  text-decoration: none;
}

.error-msg {
  background: rgba(255, 50, 50, 0.1);
  border: 1px solid rgba(255, 50, 50, 0.3);
  color: #ff6b6b;
  padding: 10px 16px;
  font-size: 0.85rem;
  border-radius: 2px;
}

.start-btn {
  background: #C9A84C;
  color: #000;
  border: none;
  padding: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 1px;
}

.start-btn:hover:not(:disabled) {
  background: #e0bc5a;
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.privacy-note {
  text-align: center;
  font-size: 0.75rem;
  color: #444;
  margin: 0;
}
</style>
