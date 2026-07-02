import React, { useMemo, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { loadState, saveState, uid } from './services/storage'
import { ACTIVITY_TYPES } from './data/defaults'
import { isoToday, monthKey, monthLabel, sameMonth, diffHours } from './utils/date'
import { exportCSV, exportExcel, exportPDF } from './services/export'
import './styles.css'

function App(){
  const [state,setState] = useState(loadState)
  const [tab,setTab] = useState('dashboard')
  const [month,setMonth] = useState(monthKey())
  useEffect(()=>saveState(state),[state])
  const monthData = useMemo(()=>({
    deslocacoes: state.deslocacoes.filter(x=>sameMonth(x.data, month)),
    prevencoes: state.prevencoes.filter(x=>sameMonth(x.data, month)),
    atividades: state.atividades.filter(x=>sameMonth(x.data, month))
  }),[state,month])
  const stats = useMemo(()=>({
    deslocacoes: monthData.deslocacoes.length,
    bt: monthData.prevencoes.filter(p=>p.tipo==='BT').length,
    cc: monthData.prevencoes.filter(p=>p.tipo==='CC').length,
    atividades: monthData.atividades.length,
    horasDeslocacao: monthData.deslocacoes.reduce((s,d)=>s+diffHours(d.saida,d.chegada),0),
    horasAtividades: monthData.atividades.reduce((s,a)=>s+diffHours(a.inicio,a.fim),0)
  }),[monthData])
  const update = (patch) => setState(s=>({...s,...patch}))
  return <>
    <header className="hero"><img src="/IP_RJP/icons/icon-192.png"/><div><h1>{state.settings.appTitle}</h1><p>{state.settings.subtitle}</p></div></header>
    <main>
      <div className="toolbar"><input type="month" value={month} onChange={e=>setMonth(e.target.value)} /><button onClick={()=>setTab('deslocacoes')}>+ Deslocação</button><button onClick={()=>setTab('prevencoes')}>+ Prevenção</button><button onClick={()=>setTab('atividades')}>+ Atividade</button></div>
      <nav className="tabs">{['dashboard','calendario','deslocacoes','prevencoes','atividades','viaturas','exportar','outlook','sobre'].map(t=><button className={tab===t?'active':''} onClick={()=>setTab(t)} key={t}>{label(t)}</button>)}</nav>
      {tab==='dashboard' && <Dashboard month={month} stats={stats} data={monthData}/>} 
      {tab==='calendario' && <Calendar month={month} data={monthData}/>} 
      {tab==='deslocacoes' && <Deslocacoes state={state} setState={setState} month={month}/>} 
      {tab==='prevencoes' && <Prevencoes state={state} setState={setState} month={month}/>} 
      {tab==='atividades' && <Atividades state={state} setState={setState} month={month}/>} 
      {tab==='viaturas' && <Viaturas state={state} setState={setState}/>} 
      {tab==='exportar' && <Exportar state={state} month={month}/>} 
      {tab==='outlook' && <Outlook/>} 
      {tab==='sobre' && <Sobre settings={state.settings}/>} 
    </main>
  </>
}
function label(t){return ({dashboard:'Dia',calendario:'Calendário',deslocacoes:'Deslocações',prevencoes:'Prevenções',atividades:'Atividades',viaturas:'Viaturas',exportar:'Exportar',outlook:'Outlook',sobre:'Sobre'})[t]}
function Dashboard({month,stats,data}){return <section><h2>Dashboard — {monthLabel(month)}</h2><div className="cards"><Card title="Deslocações" value={stats.deslocacoes}/><Card title="Prevenções BT" value={stats.bt}/><Card title="Prevenções CC" value={stats.cc}/><Card title="Atividades" value={stats.atividades}/><Card title="Horas deslocação" value={`${stats.horasDeslocacao.toFixed(1)}h`}/><Card title="Horas atividades" value={`${stats.horasAtividades.toFixed(1)}h`}/></div><h3>Últimos registos</h3><List items={[...data.deslocacoes.map(d=>['🚗',d.data,`${d.origem} → ${d.destino}`,d.matricula]),...data.prevencoes.map(p=>['🟢',p.data,`Prevenção ${p.tipo}`,'']),...data.atividades.map(a=>['📋',a.data,a.tipo,a.local||''])].slice(-10).reverse()} /></section>}
function Card({title,value}){return <div className="card"><span>{title}</span><strong>{value}</strong></div>}
function List({items}){return <div className="list">{items.length?items.map((it,i)=><div className="row" key={i}><b>{it[0]}</b><span>{it[1]}</span><span>{it[2]}</span><small>{it[3]}</small></div>):<p className="muted">Sem registos.</p>}</div>}
function Calendar({month,data}){const [y,m]=month.split('-').map(Number); const days=new Date(y,m,0).getDate(); return <section><h2>Calendário — {monthLabel(month)}</h2><div className="calendar">{Array.from({length:days},(_,i)=>{const d=`${month}-${String(i+1).padStart(2,'0')}`; const hasD=data.deslocacoes.some(x=>x.data===d); const p=data.prevencoes.find(x=>x.data===d); const hasA=data.atividades.some(x=>x.data===d); return <div className="day" key={d}><b>{i+1}</b><div>{hasD&&<span>🚗</span>}{p&&<span className={p.tipo==='BT'?'bt':'cc'}>{p.tipo}</span>}{hasA&&<span>📋</span>}</div></div>})}</div></section>}
function Deslocacoes({state,setState,month}){const empty={data:isoToday(),origem:'Leiria',destino:'Caldas da Rainha',matricula:state.vehicles[0]?.matricula||'',saida:'08:00',chegada:'17:00',atividade:'',obs:''}; const [f,setF]=useState(empty); const save=()=>{setState(s=>({...s,deslocacoes:[...s.deslocacoes,{...f,id:uid('d')}]})); setF(empty)}; return <section><h2>Deslocações</h2><FormGrid><Input label="Data" type="date" v={f.data} set={v=>setF({...f,data:v})}/><Select label="Origem" v={f.origem} set={v=>setF({...f,origem:v})} opts={state.locations}/><Select label="Destino" v={f.destino} set={v=>setF({...f,destino:v})} opts={state.locations}/><Select label="Viatura" v={f.matricula} set={v=>setF({...f,matricula:v})} opts={state.vehicles.map(v=>v.matricula)}/><Input label="Saída" type="time" v={f.saida} set={v=>setF({...f,saida:v})}/><Input label="Chegada" type="time" v={f.chegada} set={v=>setF({...f,chegada:v})}/><Input label="Atividade" v={f.atividade} set={v=>setF({...f,atividade:v})}/><Input label="Observações" v={f.obs} set={v=>setF({...f,obs:v})}/></FormGrid><button className="primary" onClick={save}>Guardar deslocação</button><List items={state.deslocacoes.filter(d=>sameMonth(d.data,month)).map(d=>['🚗',d.data,`${d.origem} → ${d.destino}`,`${d.matricula} ${d.saida}-${d.chegada}`])}/></section>}
function Prevencoes({state,setState,month}){const [f,setF]=useState({data:isoToday(),tipo:'BT',obs:''}); const save=()=>{setState(s=>({...s,prevencoes:[...s.prevencoes,{...f,id:uid('p')}]})); setF({data:isoToday(),tipo:'BT',obs:''})}; return <section><h2>Prevenções BT/CC</h2><FormGrid><Input label="Data" type="date" v={f.data} set={v=>setF({...f,data:v})}/><Select label="Tipo" v={f.tipo} set={v=>setF({...f,tipo:v})} opts={['BT','CC']}/><Input label="Observações" v={f.obs} set={v=>setF({...f,obs:v})}/></FormGrid><button className="primary" onClick={save}>Guardar prevenção</button><List items={state.prevencoes.filter(p=>sameMonth(p.data,month)).map(p=>['🟢',p.data,`Prevenção ${p.tipo}`,p.obs])}/></section>}
function Atividades({state,setState,month}){const [f,setF]=useState({data:isoToday(),inicio:'09:00',fim:'10:00',tipo:'Inspeção de edifício',local:'',obs:''}); const save=()=>{setState(s=>({...s,atividades:[...s.atividades,{...f,id:uid('a')}]}));}; return <section><h2>Atividades</h2><FormGrid><Input label="Data" type="date" v={f.data} set={v=>setF({...f,data:v})}/><Input label="Início" type="time" v={f.inicio} set={v=>setF({...f,inicio:v})}/><Input label="Fim" type="time" v={f.fim} set={v=>setF({...f,fim:v})}/><Select label="Tipo" v={f.tipo} set={v=>setF({...f,tipo:v})} opts={ACTIVITY_TYPES}/><Input label="Local" v={f.local} set={v=>setF({...f,local:v})}/><Input label="Observações" v={f.obs} set={v=>setF({...f,obs:v})}/></FormGrid><button className="primary" onClick={save}>Guardar atividade</button><List items={state.atividades.filter(a=>sameMonth(a.data,month)).map(a=>['📋',a.data,a.tipo,`${a.local} ${a.inicio}-${a.fim}`])}/></section>}
function Viaturas({state,setState}){const [f,setF]=useState({matricula:'',marca:'',modelo:'',cor:'Branco',tipo:'Viatura de serviço',ativa:true}); const save=()=>{ if(!f.matricula) return; setState(s=>({...s,vehicles:[...s.vehicles,{...f,id:uid('v')}]})); setF({matricula:'',marca:'',modelo:'',cor:'Branco',tipo:'Viatura de serviço',ativa:true})}; return <section><h2>Viaturas</h2><div className="vehicleGrid">{state.vehicles.map(v=><div className="vehicle" key={v.id}><strong>{v.matricula}</strong><span>{v.marca} {v.modelo}</span><small>{v.tipo} • {v.cor}</small></div>)}</div><h3>Adicionar viatura</h3><FormGrid><Input label="Matrícula" v={f.matricula} set={v=>setF({...f,matricula:v.toUpperCase()})}/><Input label="Marca" v={f.marca} set={v=>setF({...f,marca:v})}/><Input label="Modelo" v={f.modelo} set={v=>setF({...f,modelo:v})}/><Input label="Cor" v={f.cor} set={v=>setF({...f,cor:v})}/></FormGrid><button className="primary" onClick={save}>Guardar viatura</button></section>}
function Exportar({state,month}){return <section><h2>Exportar — {monthLabel(month)}</h2><div className="actions"><button onClick={()=>exportPDF(state,month)}>Gerar PDF / Imprimir</button><button onClick={()=>exportCSV(state,month)}>Criar CSV</button><button onClick={()=>exportExcel(state,month)}>Criar Excel</button></div></section>}
function Outlook(){return <section><h2>Outlook / Microsoft 365</h2><p>Preparado para Microsoft Graph. Configura o Client ID e Tenant ID no ficheiro de configuração quando criares o registo no Microsoft Entra.</p><div className="card"><strong>Funcionalidades previstas</strong><p>Importar agenda, exportar deslocações, exportar prevenções BT/CC e sincronizar atividades.</p></div></section>}
function Sobre({settings}){return <section className="about"><h2>{settings.appTitle}</h2><p><b>Autor</b><br/>{settings.author}</p><p>{settings.org}</p><p>© {settings.year}</p></section>}
function FormGrid({children}){return <div className="formGrid">{children}</div>}
function Input({label,type='text',v,set}){return <label>{label}<input type={type} value={v} onChange={e=>set(e.target.value)}/></label>}
function Select({label,v,set,opts}){return <label>{label}<select value={v} onChange={e=>set(e.target.value)}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select></label>}

createRoot(document.getElementById('root')).render(<App />)
