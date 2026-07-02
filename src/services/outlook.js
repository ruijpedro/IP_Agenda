import { PublicClientApplication } from '@azure/msal-browser'

const SCOPES = [
  'User.Read',
  'Calendars.ReadWrite',
  'Tasks.ReadWrite',
  'Contacts.Read',
  'offline_access',
  'openid',
  'profile'
]

let msalInstance = null
let activeConfigKey = ''

function makeAuthority(settings) {
  const tenant = settings.tenantId?.trim() || 'common'
  return `https://login.microsoftonline.com/${tenant}`
}

export async function getMsal(settings) {
  const key = `${settings.clientId}|${settings.tenantId}|${settings.redirectUri}`
  if (!msalInstance || key !== activeConfigKey) {
    activeConfigKey = key
    msalInstance = new PublicClientApplication({
      auth: {
        clientId: settings.clientId,
        authority: makeAuthority(settings),
        redirectUri: settings.redirectUri || window.location.origin
      },
      cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: false }
    })
    await msalInstance.initialize()
  }
  return msalInstance
}

export async function signIn(settings) {
  if (!settings.clientId) throw new Error('Falta o Application/Client ID nas definições.')
  const pca = await getMsal(settings)
  const result = await pca.loginPopup({ scopes: SCOPES })
  pca.setActiveAccount(result.account)
  return result.account
}

export async function signOut(settings) {
  const pca = await getMsal(settings)
  const account = pca.getActiveAccount() || pca.getAllAccounts()[0]
  if (account) await pca.logoutPopup({ account })
}

export async function getAccount(settings) {
  if (!settings.clientId) return null
  const pca = await getMsal(settings)
  const account = pca.getActiveAccount() || pca.getAllAccounts()[0]
  if (account) pca.setActiveAccount(account)
  return account || null
}

export async function getToken(settings) {
  const pca = await getMsal(settings)
  const account = pca.getActiveAccount() || pca.getAllAccounts()[0]
  if (!account) throw new Error('Conta Microsoft não ligada.')
  try {
    const result = await pca.acquireTokenSilent({ account, scopes: SCOPES })
    return result.accessToken
  } catch {
    const result = await pca.acquireTokenPopup({ account, scopes: SCOPES })
    return result.accessToken
  }
}

async function graph(settings, path, options = {}) {
  const token = await getToken(settings)
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export async function fetchEvents(settings, start, end) {
  const qs = new URLSearchParams({ startDateTime: start, endDateTime: end, '$orderby': 'start/dateTime', '$top': '50' })
  return graph(settings, `/me/calendarView?${qs.toString()}`)
}

export async function createEvent(settings, activity) {
  const body = {
    subject: activity.title || activity.type || 'Atividade IP_RJP',
    body: { contentType: 'HTML', content: activity.notes || 'Criado pela IP_RJP' },
    start: { dateTime: `${activity.date}T${activity.start || '09:00'}:00`, timeZone: 'Europe/Lisbon' },
    end: { dateTime: `${activity.date}T${activity.end || '10:00'}:00`, timeZone: 'Europe/Lisbon' },
    location: { displayName: activity.location || '' },
    categories: ['IP_RJP']
  }
  return graph(settings, '/me/events', { method: 'POST', body: JSON.stringify(body) })
}

export async function fetchTodoTasks(settings) {
  const lists = await graph(settings, '/me/todo/lists?$top=20')
  const list = lists.value?.[0]
  if (!list) return { value: [] }
  return graph(settings, `/me/todo/lists/${list.id}/tasks?$top=50`)
}

export async function createTodoTask(settings, title, dueDate) {
  const lists = await graph(settings, '/me/todo/lists?$top=20')
  const list = lists.value?.[0]
  if (!list) throw new Error('Não foi encontrada uma lista do Microsoft To Do.')
  const body = {
    title,
    ...(dueDate ? { dueDateTime: { dateTime: `${dueDate}T17:00:00`, timeZone: 'Europe/Lisbon' } } : {})
  }
  return graph(settings, `/me/todo/lists/${list.id}/tasks`, { method: 'POST', body: JSON.stringify(body) })
}

export async function fetchContacts(settings) {
  return graph(settings, '/me/contacts?$top=50&$orderby=displayName')
}
