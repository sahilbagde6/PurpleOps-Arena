import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ─── Auth ───────────────────────────────────────────────
export const authAPI = {
  login:    (email, password) => api.post('/auth/login', { email, password }),
  register: (email, display_name, password) => api.post('/auth/register', { email, display_name, password }),
  me:       () => api.get('/auth/me'),
}

// ─── Scenarios ──────────────────────────────────────────
export const scenariosAPI = {
  list:   ()           => api.get('/scenarios'),
  create: (data)       => api.post('/scenarios', data),
  run:    (id)         => api.post(`/scenarios/${id}/run`),
  getRun: (runId)      => api.get(`/runs/${runId}`),
}

// ─── Detections ─────────────────────────────────────────
export const detectionsAPI = {
  list:       (runId)        => api.get('/detections', { params: { run_id: runId } }),
  listRules:  ()             => api.get('/detections/rules'),
  updateRule: (id, data)     => api.put(`/detections/rules/${id}`, data),
  testRule:   (id)           => api.post(`/detections/rules/${id}/test`),
}

// ─── Incidents ──────────────────────────────────────────
export const incidentsAPI = {
  list:        (showAll = false) => api.get('/incidents', { params: { recent_only: !showAll } }),
  get:         (id) => api.get(`/incidents/${id}`),
  getTimeline: (id) => api.get(`/incidents/${id}/timeline`),
  setStatus:   (id, status) => api.put(`/incidents/${id}/status`, null, { params: { status } }),
}

// ─── AI ─────────────────────────────────────────────────
export const aiAPI = {
  analyze: (incident_id, mode) => api.post('/ai/analyze', { incident_id, mode }),
  rca:     (incident_id, missed_technique) => api.post('/ai/rca', { incident_id, missed_technique }),
  // chat uses fetch for streaming SSE
  chatStream: async (message, mode, onChunk) => {
    const token = localStorage.getItem('access_token')
    const res = await fetch('/api/v1/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message, mode }),
    })
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value).split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          try { onChunk(JSON.parse(data).text) } catch {}
        }
      }
    }
  },
}

// ─── Reports ────────────────────────────────────────────
export const reportsAPI = {
  scorecard:   ()       => api.get('/reports/scorecard'),
  heatmap:     ()       => api.get('/reports/attack-heatmap'),
  export:      (format) => api.post('/reports/export', null, { params: { format } }),
}
