export const DEFAULT_SETTINGS = {
  googleClientId: '',
  googleApiKey: '',
  appsScriptUrl: '',
  redirectUri: window.location.origin,
  userName: 'Rui Jorge Pedro',
  organization: 'Infraestruturas de Portugal'
}

const KEYS = {
  settings: 'ip_rjp_google_settings_v1',
  activities: 'ip_rjp_google_activities_v1'
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
