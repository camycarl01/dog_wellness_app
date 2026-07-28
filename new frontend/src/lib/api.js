import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
  // Use the Vite dev proxy in development to avoid browser CORS issues.
  baseURL: import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || ''),
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
