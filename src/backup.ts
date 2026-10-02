import type { AppData } from './types'
import { validDate } from './dates'

export function safeUrl(value:string){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:''}catch{return ''}}
const object=(v:any)=>v&&typeof v==='object'&&!Array.isArray(v)
const strings=(v:any)=>Array.isArray(v)&&v.every(x=>typeof x==='string')
const integer=(v:any,min=0,max=2147483647)=>Number.isInteger(v)&&v>=min&&v<=max
const stamp=(v:any)=>typeof v==='string'&&Number.isFinite(Date.parse(v))
export function parseBackup(raw:unknown):AppData{
  const d=raw as any
  const fail=()=>{throw new Error('Invalid backup. Choose a GrappleLog JSON export with valid profiles, techniques, sessions and gameplans.')}
  if(!object(d)||!object(d.profile)||!['techniques','sessions','flows'].every(k=>Array.isArray(d[k])&&d[k].length<=20000))return fail()
  const p=d.profile
  if(typeof p.id!=='string'||typeof p.displayName!=='string'||!p.displayName.trim()||!['White','Blue','Purple','Brown','Black'].includes(p.belt)||!integer(p.stripes,0,4)||!integer(p.weeklySessionGoal??3,1,14)||!stamp(p.createdAt)||(p.competitionDate&&!validDate(p.competitionDate)))return fail()
  for(const key of ['gym','focusPosition','competitionDate','competitionWeight'])if(p[key]!=null&&typeof p[key]!=='string')return fail()
  for(const key of ['techniques','sessions','flows']){
    const ids=new Set<string>()
    for(const item of d[key]){
      if(!object(item)||typeof item.id!=='string'||!item.id||ids.has(item.id)||!stamp(item.createdAt))return fail()
      ids.add(item.id)
    }
  }
  for(const t of d.techniques){
    if(typeof t.name!=='string'||!t.name.trim()||!['Takedown','Guard','Pass','Sweep','Escape','Submission','Control','Defense','Transition','Other'].includes(t.category)||!['Gi','No-Gi','Both'].includes(t.giMode)||!strings(t.tags)||!integer(t.confidence,1,5)||!integer(t.drillingCount)||!stamp(t.updatedAt))return fail()
    for(const key of ['position','notes','videoUrl'])if(typeof t[key]!=='string')return fail()
    if(t.videoUrl&&!safeUrl(t.videoUrl))return fail()
  }
  for(const s of d.sessions){
    if(!validDate(s.trainedAt)||!['Gi','No-Gi'].includes(s.mode)||!['Class + Sparring','Open Mat','Positional','Drilling'].includes(s.sessionType||'Class + Sparring')||!strings(s.techniqueIds)||!strings(s.partners)||!integer(s.rating,1,5))return fail()
    for(const key of ['durationMin','rounds','submissions','taps'])if(!integer(s[key]))return fail()
    if(!integer(s.positionalRounds??0))return fail()
    for(const key of ['notes','focusPosition','whatWorked','whatFailed','nextFocus'])if(s[key]!=null&&typeof s[key]!=='string')return fail()
  }
  for(const f of d.flows){
    if(typeof f.name!=='string'||!f.name.trim()||typeof f.description!=='string'||!stamp(f.updatedAt)||!Array.isArray(f.nodes)||!Array.isArray(f.edges)||!strings(f.tags||[])||!Array.isArray(f.references||[]))return fail()
    const nodeIds=new Set<string>()
    for(const n of f.nodes){if(!object(n)||typeof n.id!=='string'||nodeIds.has(n.id)||!object(n.position)||!Number.isFinite(n.position.x)||!Number.isFinite(n.position.y)||!object(n.data)||typeof n.data.label!=='string'||!['position','reaction','technique','submission'].includes(n.data.kind)||(n.data.note!=null&&typeof n.data.note!=='string')||(n.data.techniqueId!=null&&typeof n.data.techniqueId!=='string'))return fail();nodeIds.add(n.id)}
    const edgeIds=new Set<string>()
    for(const e of f.edges){if(!object(e)||typeof e.id!=='string'||edgeIds.has(e.id)||!nodeIds.has(e.source)||!nodeIds.has(e.target)||(e.label!=null&&typeof e.label!=='string'))return fail();edgeIds.add(e.id)}
    for(const r of f.references||[])if(!object(r)||typeof r.label!=='string'||typeof r.url!=='string'||!safeUrl(r.url))return fail()
  }
  return {
    profile:{...p,weeklySessionGoal:p.weeklySessionGoal??3,gym:p.gym||'',focusPosition:p.focusPosition||'',competitionDate:p.competitionDate||'',competitionWeight:p.competitionWeight||'',onboardingCompleted:Boolean(p.onboardingCompleted)},
    techniques:d.techniques.map((t:any)=>({...t,isFavorite:Boolean(t.isFavorite),inDrillQueue:Boolean(t.inDrillQueue)})),
    sessions:d.sessions.map((s:any)=>({...s,sessionType:s.sessionType||'Class + Sparring',notes:s.notes||'',focusPosition:s.focusPosition||'',positionalRounds:s.positionalRounds??0})),
    flows:d.flows.map((f:any)=>({...f,tags:f.tags||[],references:f.references||[]})),
  }
}

/** Stable per-account IDs make retries safe when importing another account's export. */
export async function prepareBackup(raw:unknown,profileId:string):Promise<AppData>{
  const data=parseBackup(raw)
  if(data.profile.id===profileId)return data
  const idFor=async(kind:string,id:string)=>{
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${profileId}:${kind}:${id}`))
    const hex=Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('')
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`
  }
  const ids=new Map(await Promise.all(data.techniques.map(async t=>[t.id,await idFor('technique',t.id)] as const)))
  return {...data,profile:{...data.profile,id:profileId},techniques:data.techniques.map(t=>({...t,id:ids.get(t.id)!})),sessions:await Promise.all(data.sessions.map(async s=>({...s,id:await idFor('session',s.id),techniqueIds:s.techniqueIds.map(id=>ids.get(id)||id)}))),flows:await Promise.all(data.flows.map(async f=>({...f,id:await idFor('flow',f.id),nodes:f.nodes.map(n=>({...n,data:{...n.data,...(n.data.techniqueId?{techniqueId:ids.get(n.data.techniqueId)||n.data.techniqueId}:{})}}))})))}
}

export const mergeById=<T extends {id:string}>(current:T[],incoming:T[])=>Array.from(new Map([...current,...incoming].map(x=>[x.id,x])).values())
