import { sameMonth, monthLabel, diffHours } from '../utils/date'

export function exportCSV(state, month) {
  const rows = [['Data','Tipo','Origem','Destino','Matrícula','Saída','Chegada','Prevenção','Atividade','Observações']]
  state.deslocacoes.filter(d=>sameMonth(d.data, month)).forEach(d=>rows.push([d.data,'Deslocação',d.origem,d.destino,d.matricula,d.saida,d.chegada,'',d.atividade||'',d.obs||'']))
  state.prevencoes.filter(p=>sameMonth(p.data, month)).forEach(p=>rows.push([p.data,'Prevenção','','','','','',p.tipo,'',p.obs||'']))
  state.atividades.filter(a=>sameMonth(a.data, month)).forEach(a=>rows.push([a.data,'Atividade','','','',a.inicio,a.fim,'',a.tipo,a.obs||'']))
  download(`IP_RJP_${month}.csv`, rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(';')).join('\n'), 'text/csv;charset=utf-8')
}

export function exportExcel(state, month) {
  const html = `<html><head><meta charset="utf-8"></head><body><h2>IP_RJP — ${monthLabel(month)}</h2>${tableHtml(state, month)}</body></html>`
  download(`IP_RJP_${month}.xls`, html, 'application/vnd.ms-excel')
}

export function exportPDF(state, month) {
  const w = window.open('', '_blank')
  w.document.write(`<html><head><title>IP_RJP ${month}</title><style>body{font-family:Arial;padding:24px}table{border-collapse:collapse;width:100%;margin-top:16px}td,th{border:1px solid #888;padding:6px;font-size:12px}h1{color:#007f73}</style></head><body><h1>IP_RJP</h1><p>Autor: ${state.settings.author}<br>${state.settings.org}<br>© ${state.settings.year}</p><h2>${monthLabel(month)}</h2>${tableHtml(state, month)}<script>window.print()</script></body></html>`)
  w.document.close()
}

function tableHtml(state, month){
  const linhas = []
  state.deslocacoes.filter(d=>sameMonth(d.data, month)).forEach(d=>linhas.push(`<tr><td>${d.data}</td><td>Deslocação</td><td>${d.origem} → ${d.destino}</td><td>${d.matricula}</td><td>${d.saida}–${d.chegada}</td><td>${d.obs||''}</td></tr>`))
  state.prevencoes.filter(p=>sameMonth(p.data, month)).forEach(p=>linhas.push(`<tr><td>${p.data}</td><td>Prevenção ${p.tipo}</td><td></td><td></td><td></td><td>${p.obs||''}</td></tr>`))
  state.atividades.filter(a=>sameMonth(a.data, month)).forEach(a=>linhas.push(`<tr><td>${a.data}</td><td>Atividade</td><td>${a.tipo} — ${a.local||''}</td><td></td><td>${a.inicio}–${a.fim}</td><td>${a.obs||''}</td></tr>`))
  return `<table><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Matrícula</th><th>Horas</th><th>Observações</th></tr></thead><tbody>${linhas.join('') || '<tr><td colspan="6">Sem registos</td></tr>'}</tbody></table>`
}
function download(filename, content, type){ const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href) }
