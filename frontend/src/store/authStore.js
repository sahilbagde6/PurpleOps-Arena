import { create } from 'zustand'
import { authAPI } from '../api'

export const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  error: null,
  authChecked: false,   // Fix 9: true once we know auth status

  setAuthChecked: () => set({ authChecked: true }),

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const res = await authAPI.login(email, password)
      localStorage.setItem('access_token', res.data.access_token)
      const me = await authAPI.me()
      set({ user: me.data, loading: false, authChecked: true })
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Login failed', loading: false, authChecked: true })
    }
  },

  register: async (email, display_name, password) => {
    set({ loading: true, error: null })
    try {
      const res = await authAPI.register(email, display_name, password)
      localStorage.setItem('access_token', res.data.access_token)
      const me = await authAPI.me()
      set({ user: me.data, loading: false, authChecked: true })
    } catch (err) {
      set({ error: err.response?.data?.detail || 'Registration failed', loading: false, authChecked: true })
    }
  },

  fetchMe: async () => {
    try {
      const me = await authAPI.me()
      set({ user: me.data, authChecked: true })
    } catch {
      localStorage.removeItem('access_token')
      set({ user: null, authChecked: true })
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    set({ user: null, authChecked: true })
  },
}))
