import axios from 'axios'
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants'

if (import.meta.env.DEV) {
  console.log('[API] Base URL:', API_BASE_URL)
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Apache on the live host rejects PUT/PATCH/DELETE with a 403 before they reach
// Node, so send them as POST + an override header the backend translates back.
// (axios uses XHR, so the window.fetch patch in utils/httpMethodOverride.js
// does not cover these calls.)
const OVERRIDDEN_METHODS = ['put', 'patch', 'delete']

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const method = String(config.method || 'get').toLowerCase()
    if (OVERRIDDEN_METHODS.includes(method)) {
      config.headers['X-HTTP-Method-Override'] = method.toUpperCase()
      config.method = 'post'
    }
    // Log API requests in development
    const base = config.baseURL || api.defaults.baseURL || ''
    const path = (config.url || '').startsWith('http') ? config.url : (base + (config.url || ''))
    if (import.meta.env.DEV) {
      console.log('API Request:', config.method?.toUpperCase(), path || config.url)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Paths commonly probed by browser extensions / password managers / scanners.
// We silently swallow 404s for these so they don't bubble up as user-facing toasts.
const PROBE_PATH_PATTERN = /\.(shtml|asp|aspx|php|cgi|jsp|env|git|bak|old|sql)(\?|$)|(wp-login|wp-admin|phpmyadmin|\.well-known|favicon\.ico)/i

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      window.location.href = '/login'
    }
    // Silently drop 404s caused by extension/scanner probes so they don't
    // surface as "Route /xxx.shtml not found" toasts in the UI.
    const url = error.config?.url || ''
    if (error.response?.status === 404 && PROBE_PATH_PATTERN.test(url)) {
      return Promise.resolve({ data: { success: false, message: 'probe-ignored' }, status: 404, silent: true })
    }
    return Promise.reject(error)
  }
)

export default api
