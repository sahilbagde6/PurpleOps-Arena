import { create } from 'zustand'
import { scenariosAPI, incidentsAPI, detectionsAPI, reportsAPI } from '../api'

export const useScenariosStore = create((set) => ({
  scenarios: [],
  activeRun: null,
  runStatus: null,

  fetchScenarios: async () => {
    try {
      const res = await scenariosAPI.list()
      set({ scenarios: res.data })
    } catch {
      // API not available — demo mode uses fallback data in the component
    }
  },

  launchScenario: async (id) => {
    const res = await scenariosAPI.run(id)
    set({ activeRun: res.data.run_id, runStatus: 'pending' })
    return res.data
  },

  pollRun: async (runId) => {
    const res = await scenariosAPI.getRun(runId)
    set({ runStatus: res.data.status })
    return res.data
  },
}))

export const useIncidentsStore = create((set) => ({
  incidents: [],
  selectedIncident: null,
  timeline: null,

  fetchIncidents: async (showAll = false) => {
    try {
      const res = await incidentsAPI.list(showAll)
      set({ incidents: res.data })
    } catch {
      set({ incidents: [] })
    }
  },

  fetchTimeline: async (id) => {
    try {
      const res = await incidentsAPI.getTimeline(id)
      set({ timeline: res.data, selectedIncident: res.data.incident })
    } catch {
      set({ timeline: null })
    }
  },
}))

export const useDetectionsStore = create((set, get) => ({
  rules: [],
  scorecard: null,
  heatmap: [],

  fetchRules: async () => {
    try {
      const res = await detectionsAPI.listRules()
      set({ rules: res.data })
      return res.data
    } catch {
      return []
    }
  },

  toggleRule: async (id, enabled) => {
    await detectionsAPI.updateRule(id, { enabled })
    set((state) => ({
      rules: state.rules.map((r) => (r.id === id ? { ...r, enabled } : r)),
    }))
  },

  fetchScorecard: async () => {
    try {
      const res = await reportsAPI.scorecard()
      set({ scorecard: res.data })
    } catch {
      // API not available
    }
  },

  fetchHeatmap: async () => {
    try {
      const res = await reportsAPI.heatmap()
      set({ heatmap: res.data.heatmap || [] })
    } catch {
      // API not available — demo data used in component
    }
  },
}))
