import { DEFAULT_LOCATIONS, DEFAULT_VEHICLES } from '../data/defaults'
const KEY = 'IP_RJP_PRO_3_0'

export function loadState() {
  const raw = localStorage.getItem(KEY)
  if (!raw) return initialState()
  try { return { ...initialState(), ...JSON.parse(raw) } } catch { return initialState() }
}
export function saveState(state) { localStorage.setItem(KEY, JSON.stringify(state)) }
export function initialState() {
  return {
    vehicles: DEFAULT_VEHICLES,
    locations: DEFAULT_LOCATIONS,
    deslocacoes: [],
    prevencoes: [],
    atividades: [],
    settings: {
      appTitle: 'IP_RJP',
      subtitle: 'Deslocações • Prevenções BT/CC',
      author: 'Rui Jorge Pedro',
      org: 'Infraestruturas de Portugal',
      year: '2026'
    }
  }
}
export function uid(prefix='r') { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}` }
