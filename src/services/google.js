const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/contacts.readonly'
]

let tokenClient = null
let accessToken = localStorage.getItem('ip_rjp_google_access_token_v1') || ''
let account = JSON.parse(localStorage.getItem('ip_rjp_google_account_v1') || 'null')

function isNativeApp() {
  return !!(window.Capacitor?.isNativePlatform?.() || window.location.protocol === 'capacitor:')
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve()
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.defer = true
    s.onload = resolve
    s.onerror = () => reject(new Error(`Não foi possível carregar ${src}`))
    document.head.appendChild(s)
  })
}

async function ensureGoogleIdentity(settings) {
  if (!settings.googleClientId?.trim()) throw new Error('Falta o Google Client ID nas definições.')
  await loadScript('https://accounts.google.com/gsi/client')
  if (!window.google?.accounts?.oauth2) throw new Error('Google Identity Services não carregou.')
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: settings.googleClientId.trim(),
    scope: SCOPES.join(' '),
    prompt: 'consent',
    callback: () => {}
  })
  return tokenClient
}

function requireAppsScript(settings) {
  if (!settings.appsScriptUrl?.trim()) {
    throw new Error('Na APK usa o Apps Script URL. Preenche esse campo em Definições.')
  }
}

export async function signIn(settings) {
  if (isNativeApp()) {
    requireAppsScript(settings)
    await callAppsScript(settings, { action: 'test', payload: {} })
    account = { name: 'IP_RJP APK', email: 'Ligado via Apps Script', native: true }
    localStorage.setItem('ip_rjp_google_account_v1', JSON.stringify(account))
    return account
  }

  const client = await ensureGoogleIdentity(settings)
  const token = await new Promise((resolve, reject) => {
    client.callback = response => {
      if (response.error) return reject(new Error(response.error_description || response.error))
      resolve(response.access_token)
    }
    client.requestAccessToken({ prompt: 'consent' })
  })

  accessToken = token
  localStorage.setItem('ip_rjp_google_access_token_v1', token)
  account = await googleApi('https://www.googleapis.com/oauth2/v3/userinfo', { absolute: true })
  localStorage.setItem('ip_rjp_google_account_v1', JSON.stringify(account))
  return account
}

export async function signOut() {
  if (accessToken && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(accessToken, () => {})
  }
  accessToken = ''
  account = null
  localStorage.removeItem('ip_rjp_google_access_token_v1')
  localStorage.removeItem('ip_rjp_google_account_v1')
}

export async function getAccount() {
  return account || null
}

export async function getToken(settings) {
  if (isNativeApp()) throw new Error('Na APK a sincronização usa Apps Script, sem Google Identity Services.')
  if (accessToken) return accessToken
  const client = await ensureGoogleIdentity(settings)
  return new Promise((resolve, reject) => {
    client.callback = response => {
      if (response.error) return reject(new Error(response.error_description || response.error))
      accessToken = response.access_token
      localStorage.setItem('ip_rjp_google_access_token_v1', accessToken)
      resolve(accessToken)
    }
    client.requestAccessToken({ prompt: '' })
  })
}

async function googleApi(path, options = {}) {
  const { settings, absolute, ...fetchOptions } = options
  const token = accessToken || (settings ? await getToken(settings) : '')
  if (!token) throw new Error('Conta Google não ligada.')

  const url = absolute ? path : `https://www.googleapis.com${path}`
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
    ...(fetchOptions.headers || {})
  }

  const res = await fetch(url, { ...fetchOptions, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export async function fetchEvents(settings, start, end) {
  if (isNativeApp()) {
    return callAppsScript(settings, { action: 'getCalendarEvents', payload: { start, end } })
  }

  const qs = new URLSearchParams({
    timeMin: start,
    timeMax: end,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50'
  })
  return googleApi(`/calendar/v3/calendars/primary/events?${qs}`, { settings })
}

export async function createEvent(settings, activity) {
  if (isNativeApp()) {
    return callAppsScript(settings, { action: 'createCalendarEvent', payload: activity })
  }

  const body = {
    summary: activity.title || activity.type || 'Atividade IP_RJP',
    description: activity.notes || 'Criado pela IP_RJP',
    location: activity.location || '',
    start: { dateTime: `${activity.date}T${activity.start || '09:00'}:00`, timeZone: 'Europe/Lisbon' },
    end: { dateTime: `${activity.date}T${activity.end || '10:00'}:00`, timeZone: 'Europe/Lisbon' }
  }
  return googleApi('/calendar/v3/calendars/primary/events', { settings, method: 'POST', body: JSON.stringify(body) })
}

export async function fetchTodoTasks(settings) {
  if (isNativeApp()) return callAppsScript(settings, { action: 'getTasks', payload: {} })

  const lists = await googleApi('/tasks/v1/users/@me/lists?maxResults=20', { settings })
  const list = lists.items?.[0]
  if (!list) return { items: [] }
  return googleApi(`/tasks/v1/lists/${encodeURIComponent(list.id)}/tasks?maxResults=50&showCompleted=true`, { settings })
}

export async function createTodoTask(settings, title, dueDate) {
  if (isNativeApp()) return callAppsScript(settings, { action: 'createTask', payload: { title, dueDate } })

  const lists = await googleApi('/tasks/v1/users/@me/lists?maxResults=20', { settings })
  const list = lists.items?.[0]
  if (!list) throw new Error('Não foi encontrada uma lista no Google Tasks.')
  const body = { title, ...(dueDate ? { due: `${dueDate}T17:00:00.000Z` } : {}) }
  return googleApi(`/tasks/v1/lists/${encodeURIComponent(list.id)}/tasks`, { settings, method: 'POST', body: JSON.stringify(body) })
}

export async function fetchContacts(settings) {
  if (isNativeApp()) return callAppsScript(settings, { action: 'getContacts', payload: {} })

  return googleApi('/people/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=100&sortOrder=FIRST_NAME_ASCENDING', { settings })
}

export async function callAppsScript(settings, payload) {
  if (!settings.appsScriptUrl?.trim()) throw new Error('Falta o Apps Script URL nas definições.')

  const res = await fetch(settings.appsScriptUrl.trim(), {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`)
  return res.json()
}
