import type { Session } from './types'
import { weekLabel } from './weekLabel'

export const localToday=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
export const validDate=(value:unknown):value is string=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value
export const addDays=(value:string,days:number)=>{const d=new Date(value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export const monday=(value:string)=>{const d=new Date(value+'T12:00:00Z');return addDays(value,-((d.getUTCDay()+6)%7))}
export const recentSessions=(sessions:Session[],today=localToday(),days=7)=>sessions.filter(s=>s.trainedAt>=addDays(today,1-days)&&s.trainedAt<=today)
export const thisWeekSessions=(sessions:Session[],today=localToday())=>sessions.filter(s=>s.trainedAt>=monday(today)&&s.trainedAt<=today)
export function weeklyTrend(sessions:Session[],today=localToday()){
  const start=monday(today)
  return Array.from({length:8},(_,i)=>{
    const date=addDays(start,(i-7)*7),end=addDays(date,6)
    return {week:weekLabel(date),sessions:sessions.filter(s=>s.trainedAt>=date&&s.trainedAt<=end&&s.trainedAt<=today).length}
  })
}
