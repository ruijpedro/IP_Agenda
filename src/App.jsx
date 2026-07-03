import React, { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ClipboardList,
  Settings,
  LogIn,
  LogOut,
  RefreshCw,
  Plus,
  CloudUpload,
  FileText,
  Car,
  ShieldCheck,
  Search,
  Trash2
} from 'lucide-react'
import { loadSettings, saveSettings, loadActivities, saveActivities } from './services/storage.js'
import { signIn, signOut, getAccount, fetchEvents, createEvent, callAppsScript } from './services/google.js'
import './styles.css'

const tabs = [
  { id: 'registos', label: 'Registos', icon: ClipboardList },
  { id: 'deslocacoes', label: 'Deslocações', icon: Car },
  { id: 'prevencoes', label: 'Prevenções', icon: ShieldCheck },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'relatorio', label: 'Relatório/PDF', icon: FileText },
  { id: 'definicoes', label: 'Definições', icon: Settings }
]

const blank = () => ({
  id: '',
  tipo: 'Deslocação',
  data: new Date().toISOString().slice(0, 10),
  tecnico: 'Rui Jorge Pedro',
  servico: '',
  matricula: '',
  viatura: '',
  origem: '',
  destino: '',
  local: '',
  inicio: '08:00',
  fim: '17:00',
  kmInicial: '',
  kmFinal: '',
  turno: '',
  contacto: '',
  ocorrencia: 'Sem ocorrência',
  estado: 'Registado',
  observacoes: ''
})

const isNativeApp = () => !!(window.Capacitor?.isNativePlatform?.() || window.location.protocol === 'capacitor:')
const hasAppsScript = settings => !!settings.appsScriptUrl?.trim()
const sumKm = items => items.reduce((a, i) => a + Math.max(0, (Number(i.kmFinal) || 0) - (Number(i.kmInicial) || 0)), 0)
const hours = item => {
  const a = new Date(`${item.data}T${item.inicio || '00:00'}`)
  const b = new Date(`${item.data}T${item.fim || '00:00'}`)
  const diff = (b - a) / 3600000
  return diff > 0 ? diff : 0
}
const sumHours = items => items.reduce((a, i) => a + hours(i), 0)

function normalizeRecord(row) {
  if (!row) return null
  return {
    id: row.id || row.ID || crypto.randomUUID(),
    tipo: row.tipo || row.Tipo || 'Deslocação',
    data: row.data || row.Data || new Date().toISOString().slice(0, 10),
    tecnico: row.tecnico || row.Técnico || 'Rui Jorge Pedro',
    servico: row.servico || row.Serviço || row.Atividade || row.Título || '',
    matricula: row.matricula || row.Matrícula || '',
    viatura: row.viatura || row.Viatura || '',
    origem: row.origem || row.Origem || '',
    destino: row.destino || row.Destino || '',
    local: row.local || row.Local || '',
    inicio: row.inicio || row.Início || row['Hora Saída'] || '08:00',
    fim: row.fim || row.Fim || row['Hora Chegada'] || '17:00',
    kmInicial: row.kmInicial || row['Km Inicial'] || '',
    kmFinal: row.kmFinal || row['Km Final'] || '',
    turno: row.turno || row.Turno || row.Prevenção || '',
    contacto: row.contacto || row.Contacto || '',
    ocorrencia: row.ocorrencia || row.Ocorrência || 'Sem ocorrência',
    estado: row.estado || row.Estado || 'Registado',
    observacoes: row.observacoes || row.Observações || '',
    createdAt: row.createdAt || row['Criado em'] || ''
  }
}

function activityPayload(item) {
  return {
    date: item.data,
    start: item.inicio,
    end: item.fim,
    title: `${item.tipo} - ${item.servico || item.destino || item.local || 'IP_RJP'}`,
    type: item.tipo,
    location: item.local || item.destino || item.origem || '',
    notes: [
      `Técnico: ${item.tecnico}`,
      `Matrícula: ${item.matricula}`,
      `Viatura: ${item.viatura}`,
      `Origem: ${item.origem}`,
      `Destino: ${item.destino}`,
      `Local: ${item.local}`,
      `Turno: ${item.turno}`,
      `Km: ${item.kmInicial} - ${item.kmFinal}`,
      `Ocorrência: ${item.ocorrencia}`,
      `Observações: ${item.observacoes}`
    ].join('\n')
  }
}

function Header({ account, status, onLogin, onLogout }) {
  const connected = !!account
  const statusText = status?.ok
    ? '🟢 Ligado ao Apps Script'
    : connected
      ? `Google ligado: ${account.email || account.name}`
      : hasAppsScript(status?.settings || {})
        ? 'Apps Script configurado · clica em Ligar'
        : 'Modo local ativo'

  return (
    <header className="hero">
      <img src="./logo.png" alt="IP_RJP" />
      <div className="heroText">
        <h1>IP_RJP</h1>
        <p>Deslocações • Prevenções BT/CC</p>
        <small>{statusText}</small>
      </div>
      <button className="pill white" onClick={connected ? onLogout : onLogin}>
        {connected ? <LogOut /> : <LogIn />}
        {connected ? 'Sair' : 'Ligar'}
      </button>
    </header>
  )
}

function Toolbar({ active, setActive }) {
  return (
    <nav className="tabs">
      {tabs.map(t => {
        const Icon = t.icon
        return <button key={t.id} className={active === t.id ? 'active' : ''} onClick={() => setActive(t.id)}><Icon /> {t.label}</button>
      })}
    </nav>
  )
}

function Dashboard({ items, setItems, connected, settings, onSynced }) {
  const [form, setForm] = useState(blank())
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    const item = { ...form, id: form.id || crypto.randomUUID(), createdAt: new Date().toISOString() }
    const next = [item, ...items.filter(x => x.id !== item.id)]
    setItems(next)
    saveActivities(next)
    setForm(blank())
    setMsg('Registo guardado localmente.')

    if (hasAppsScript(settings)) {
      setBusy(true)
      try {
        await callAppsScript(settings, { action: 'syncRecords', payload: { records: [item] } })
        await callAppsScript(settings, { action: 'createCalendarEvent', payload: activityPayload(item) })
        setMsg('Registo guardado e sincronizado com Apps Script/Agenda.')
        onSynced?.()
      } catch (e) {
        setMsg(`Guardado localmente. Sincronização falhou: ${e.message}`)
      } finally {
        setBusy(false)
      }
    }
  }

  async function exportOne(item) {
    try {
      await createEvent(settings, activityPayload(item))
      setMsg('Exportado para a agenda.')
      onSynced?.()
    } catch (e) {
      setMsg(e.message)
    }
  }

  return (
    <section className="card">
      <h2>Novo registo</h2>
      <div className="gridForm">
        <label>Tipo<select value={form.tipo} onChange={e => update('tipo', e.target.value)}><option>Deslocação</option><option>Prevenção</option></select></label>
        <label>Data<input type="date" value={form.data} onChange={e => update('data', e.target.value)} /></label>
        <label>Técnico<input value={form.tecnico} onChange={e => update('tecnico', e.target.value)} /></label>
        <label>Serviço<input value={form.servico} onChange={e => update('servico', e.target.value)} placeholder="Ex.: Prevenção Oeste / Inspeção / Reunião" /></label>
        <label>Início<input type="time" value={form.inicio} onChange={e => update('inicio', e.target.value)} /></label>
        <label>Fim<input type="time" value={form.fim} onChange={e => update('fim', e.target.value)} /></label>
        <label>Matrícula<input value={form.matricula} onChange={e => update('matricula', e.target.value.toUpperCase())} placeholder="AA-00-AA" /></label>
        <label>Viatura<input value={form.viatura} onChange={e => update('viatura', e.target.value)} placeholder="Marca/modelo ou viatura de serviço" /></label>
        {form.tipo === 'Deslocação' && <>
          <label>Origem<input value={form.origem} onChange={e => update('origem', e.target.value)} /></label>
          <label>Destino<input value={form.destino} onChange={e => update('destino', e.target.value)} /></label>
          <label>Km inicial<input type="number" value={form.kmInicial} onChange={e => update('kmInicial', e.target.value)} /></label>
          <label>Km final<input type="number" value={form.kmFinal} onChange={e => update('kmFinal', e.target.value)} /></label>
        </>}
        {form.tipo === 'Prevenção' && <>
          <label>Local<input value={form.local} onChange={e => update('local', e.target.value)} /></label>
          <label>Tipo prevenção<select value={form.turno} onChange={e => update('turno', e.target.value)}><option value="">Selecionar</option><option>BT</option><option>CC</option></select></label>
          <label>Contacto<input value={form.contacto} onChange={e => update('contacto', e.target.value)} /></label>
          <label>Ocorrência<select value={form.ocorrencia} onChange={e => update('ocorrencia', e.target.value)}><option>Sem ocorrência</option><option>Com ocorrência</option></select></label>
        </>}
        <label>Estado<select value={form.estado} onChange={e => update('estado', e.target.value)}><option>Registado</option><option>Validado</option><option>Submetido</option><option>Cancelado</option></select></label>
        <label className="wide">Observações<textarea value={form.observacoes} onChange={e => update('observacoes', e.target.value)} placeholder="Notas, ocorrências, referência do serviço, validação..." /></label>
      </div>
      <button onClick={save} disabled={busy}><Plus /> {busy ? 'A guardar...' : 'Guardar'}</button>
      {msg && <p className="hint">{msg}</p>}
      <h3>Últimos registos</h3>
      <RegisterList items={items.slice(0, 8)} connected={connected || hasAppsScript(settings)} exportOne={exportOne} setItems={setItems} />
    </section>
  )
}

function RegisterList({ items, connected, exportOne, setItems }) {
  function del(id) {
    const next = loadActivities().filter(x => x.id !== id)
    saveActivities(next)
    setItems?.(next)
  }

  return (
    <div className="list">
      {items.map(item => <div className="item" key={item.id}>
        <b>{item.tipo} · {item.data} · {item.servico || item.destino || item.local || 'Sem serviço'}</b>
        <span>{item.inicio}–{item.fim} · {item.matricula || 'sem matrícula'} · {item.viatura || 'sem viatura'}</span>
        <small>{item.tipo === 'Deslocação'
          ? `${item.origem || '-'} → ${item.destino || '-'} · ${Math.max(0, (Number(item.kmFinal) || 0) - (Number(item.kmInicial) || 0))} km`
          : `${item.local || '-'} · ${item.turno || '-'} · ${item.ocorrencia}`}</small>
        {item.observacoes && <small>{item.observacoes}</small>}
        <div className="rowBtns">
          <button onClick={() => exportOne?.(item)} disabled={!connected}><CloudUpload /> Exportar agenda</button>
          <button className="danger" onClick={() => del(item.id)}><Trash2 /> Apagar</button>
        </div>
      </div>)}
    </div>
  )
}

function Filtered({ title, type, items, connected, settings, setItems }) {
  const [q, setQ] = useState('')
  const data = items.filter(i => i.tipo === type).filter(i => JSON.stringify(i).toLowerCase().includes(q.toLowerCase()))
  async function exportOne(item) { await createEvent(settings, activityPayload(item)) }
  return (
    <section className="card">
      <div className="sectionTitle"><h2>{title}</h2><div className="search"><Search /><input placeholder="Pesquisar" value={q} onChange={e => setQ(e.target.value)} /></div></div>
      <div className="stats"><span>{data.length} registos</span><span>{sumHours(data).toFixed(1)} h</span><span>{sumKm(data)} km</span></div>
      <RegisterList items={data} connected={connected || hasAppsScript(settings)} exportOne={exportOne} setItems={setItems} />
    </section>
  )
}

function Agenda({ settings, connected }) {
  const [events, setEvents] = useState([])
  const [error, setError] = useState('')
  const canLoad = connected || hasAppsScript(settings)
  async function load() {
    setError('')
    try {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59).toISOString()
      const data = await fetchEvents(settings, start, end)
      setEvents(data.items || [])
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => { if (canLoad) load() }, [canLoad, settings.appsScriptUrl])
  return (
    <section className="card">
      <div className="sectionTitle"><h2>Agenda</h2><button disabled={!canLoad} onClick={load}><RefreshCw /> Atualizar</button></div>
      {!canLoad && <p className="hint">Liga a WebApp ao Google ou configura o Apps Script URL na APK.</p>}
      {error && <p className="error">{error}</p>}
      <div className="list">{events.map(ev => <div className="item" key={ev.id}><b>{ev.summary}</b><span>{new Date(ev.start.dateTime || ev.start.date).toLocaleString('pt-PT')}</span><small>{ev.location}</small></div>)}</div>
    </section>
  )
}

function Report({ items, settings }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const data = items.filter(i => i.data?.startsWith(month)).sort((a, b) => a.data.localeCompare(b.data))
  const desloc = data.filter(i => i.tipo === 'Deslocação')
  const prev = data.filter(i => i.tipo === 'Prevenção')
  return (
    <section className="card report">
      <div className="sectionTitle"><h2>Relatório mensal</h2><button onClick={() => window.print()}><FileText /> Gerar PDF</button></div>
      <label>Mês<input type="month" value={month} onChange={e => setMonth(e.target.value)} /></label>
      <div className="printArea">
        <h1>IP_RJP — Deslocações e Prevenções BT/CC</h1>
        <p><b>Mês:</b> {month} · <b>Autor:</b> {settings.userName} · <b>Organização:</b> {settings.organization}</p>
        <div className="stats"><span>Total: {data.length}</span><span>Deslocações: {desloc.length}</span><span>Prevenções: {prev.length}</span><span>Km: {sumKm(desloc)}</span><span>Horas: {sumHours(data).toFixed(1)}</span></div>
        <table><thead><tr><th>Data</th><th>Tipo</th><th>Serviço</th><th>Horário</th><th>Origem/Local</th><th>Destino</th><th>Matrícula</th><th>Km</th><th>Obs.</th></tr></thead><tbody>{data.map(i => <tr key={i.id}><td>{i.data}</td><td>{i.tipo}</td><td>{i.servico}</td><td>{i.inicio}-{i.fim}</td><td>{i.origem || i.local}</td><td>{i.destino}</td><td>{i.matricula}</td><td>{i.tipo === 'Deslocação' ? Math.max(0, (Number(i.kmFinal) || 0) - (Number(i.kmInicial) || 0)) : ''}</td><td>{i.observacoes}</td></tr>)}</tbody></table>
        <p className="signature">Assinatura / validação: ________________________________</p>
      </div>
    </section>
  )
}

function Definicoes({ settings, setSettings, onTest }) {
  const [local, setLocal] = useState(settings)
  const [msg, setMsg] = useState('')
  const native = isNativeApp()
  function save() { saveSettings(local); setSettings(local); setMsg('Definições guardadas.') }
  async function test() {
    try { await onTest(local); setMsg('Ligação Apps Script ativa.') }
    catch (e) { setMsg(e.message) }
  }
  return (
    <section className="card">
      <h2>Definições</h2>
      <div className="gridForm">
        {!native && <>
          <label>Google Client ID<input value={local.googleClientId} onChange={e => setLocal({ ...local, googleClientId: e.target.value })} placeholder="Só para WebApp" /></label>
          <label>Google API Key<input value={local.googleApiKey} onChange={e => setLocal({ ...local, googleApiKey: e.target.value })} placeholder="Opcional" /></label>
        </>}
        <label className="wide">Apps Script URL<input value={local.appsScriptUrl} onChange={e => setLocal({ ...local, appsScriptUrl: e.target.value })} placeholder="https://script.google.com/macros/s/.../exec" /></label>
        <label>Autor<input value={local.userName} onChange={e => setLocal({ ...local, userName: e.target.value })} /></label>
        <label>Organização<input value={local.organization} onChange={e => setLocal({ ...local, organization: e.target.value })} /></label>
      </div>
      <div className="rowBtns"><button onClick={save}>Guardar definições</button><button onClick={test}><RefreshCw /> Testar ligação</button></div>
      {msg && <p className="hint">{msg}</p>}
    </section>
  )
}

export default function App() {
  const [active, setActive] = useState('registos')
  const [settings, setSettings] = useState(loadSettings())
  const [items, setItems] = useState(loadActivities())
  const [account, setAccount] = useState(null)
  const [syncStatus, setSyncStatus] = useState({ ok: false, settings })
  const connected = !!account

  async function testAppsScript(customSettings = settings) {
    if (!hasAppsScript(customSettings)) throw new Error('Falta o Apps Script URL.')
    const test = await callAppsScript(customSettings, { action: 'test', payload: {} })
    if (!test.ok) throw new Error(test.error || 'Apps Script respondeu com erro.')
    setSyncStatus({ ok: true, settings: customSettings })
    const data = await callAppsScript(customSettings, { action: 'getRecords', payload: {} })
    const records = (data.records || []).map(normalizeRecord).filter(Boolean).reverse()
    if (records.length) {
      setItems(records)
      saveActivities(records)
    }
    return test
  }

  useEffect(() => {
    getAccount(settings).then(acc => {
      setAccount(acc)
      if (hasAppsScript(settings)) testAppsScript(settings).catch(() => setSyncStatus({ ok: false, settings }))
      else setSyncStatus({ ok: false, settings })
    }).catch(() => setSyncStatus({ ok: false, settings }))
  }, [settings.googleClientId, settings.appsScriptUrl])

  async function onLogin() {
    try {
      const acc = await signIn(settings)
      setAccount(acc)
      if (hasAppsScript(settings)) await testAppsScript(settings)
    } catch (e) {
      alert(e.message)
    }
  }

  async function onLogout() {
    try { await signOut(settings); setAccount(null); setSyncStatus({ ok: false, settings }) }
    catch (e) { alert(e.message) }
  }

  const page = useMemo(() => ({
    registos: <Dashboard items={items} setItems={setItems} connected={connected} settings={settings} onSynced={() => testAppsScript(settings).catch(() => {})} />,
    deslocacoes: <Filtered title="Deslocações" type="Deslocação" items={items} connected={connected} settings={settings} setItems={setItems} />,
    prevencoes: <Filtered title="Prevenções" type="Prevenção" items={items} connected={connected} settings={settings} setItems={setItems} />,
    agenda: <Agenda settings={settings} connected={connected} />,
    relatorio: <Report items={items} settings={settings} />,
    definicoes: <Definicoes settings={settings} setSettings={setSettings} onTest={testAppsScript} />
  }[active]), [active, items, connected, settings])

  return <main><Header account={account} status={syncStatus} onLogin={onLogin} onLogout={onLogout} /><Toolbar active={active} setActive={setActive} />{page}</main>
}
