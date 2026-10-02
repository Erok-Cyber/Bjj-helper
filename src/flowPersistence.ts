import type { Flow } from './types'
import { cloudUpsert } from './store'

type Job={flow:Flow;owner:string;timer?:number;running:boolean;failed:boolean}
const jobs=new Map<string,Job>()
const listeners=new Set<()=>void>()
const notify=()=>listeners.forEach(fn=>fn())
export const flowSaveState=(owner?:string)=>{const active=Array.from(jobs.values()).filter(j=>!owner||j.owner===owner);return active.some(j=>j.failed)?'error':active.length?'saving':'saved'}
export function subscribeFlowSave(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn)}}
async function run(key:string){
  const job=jobs.get(key)
  if(!job||job.running)return
  job.running=true;job.failed=false;notify()
  const snapshot=job.flow
  try{
    await cloudUpsert('flow',snapshot,job.owner)
    job.running=false
    if(job.flow!==snapshot){void run(key);return}
    jobs.delete(key)
  }catch{job.running=false;job.failed=true}
  notify()
}
export function queueFlowSave(flow:Flow,owner:string){
  const key=owner+':'+flow.id,job=jobs.get(key)||{flow,owner,running:false,failed:false}
  job.flow=flow;job.failed=false;window.clearTimeout(job.timer)
  jobs.set(key,job);job.timer=window.setTimeout(()=>void run(key),450);notify()
}
export function retryFlowSaves(owner?:string){jobs.forEach((job,key)=>{if(!owner||job.owner===owner)void run(key)})}
window.addEventListener('beforeunload',event=>{if(jobs.size){event.preventDefault();event.returnValue=''}})
