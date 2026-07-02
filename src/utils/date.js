export const pad = (n) => String(n).padStart(2, '0')
export function isoToday(){ const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
export function monthKey(date = new Date()) { return `${date.getFullYear()}-${pad(date.getMonth()+1)}` }
export function monthLabel(key){
  const [y,m] = key.split('-').map(Number)
  return new Date(y, m-1, 1).toLocaleDateString('pt-PT', { month:'long', year:'numeric' })
}
export function sameMonth(iso, key){ return iso?.startsWith(key) }
export function diffHours(start,end){
  if(!start||!end) return 0
  const [sh,sm]=start.split(':').map(Number), [eh,em]=end.split(':').map(Number)
  let mins=(eh*60+em)-(sh*60+sm); if(mins<0) mins+=24*60
  return mins/60
}
