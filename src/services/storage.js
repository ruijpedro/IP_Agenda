export const DEFAULT_SETTINGS = {
  clientId: '',
  tenantId: 'common',
  redirectUri: window.location.origin,
  userName: 'Rui Jorge Pedro',
  organization: 'Infraestruturas de Portugal'
}

const KEYS = {
  settings: 'ip_rjp_outlook_settings_v4',
  activities: 'ip_rjp_outlook_activities_v4'
}

export function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEYS.settings) || '{}') } }
  catch { return DEFAULT_SETTINGS }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings))
}

export function loadActivities() {
  try { return JSON.parse(localStorage.getItem(KEYS.activities) || '[]') }
  catch { return [] }
}

export function saveActivities(items) {
  localStorage.setItem(KEYS.activities, JSON.stringify(items))
}
