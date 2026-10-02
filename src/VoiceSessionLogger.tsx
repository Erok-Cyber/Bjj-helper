import Modal from './Modal'
import ActionButton from './ActionButton'
import { localToday } from './dates'
import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Sparkles } from 'lucide-react'
import type { Session, Technique } from './types'
import { supabase } from './supabase'

type Draft = {
  mode?: 'Gi'|'No-Gi'
  sessionType?: Session['sessionType']
  durationMin?: number
  rounds?: number
  positionalRounds?: number
  submissions?: number
  taps?: number
  rating?: number
  focusPosition?: string
  notes?: string
  partners?: string[]
  techniqueNames?: string[]
}

export default function VoiceSessionLogger({techniques,authUser,close,save}:{techniques:Technique[];authUser:string|null;close:()=>void;save:(s:Session)=>void}) {
  const [recording,setRecording]=useState(false)
  const [busy,setBusy]=useState(false)
  const [status,setStatus]=useState('')
  const [transcript,setTranscript]=useState('')
  const [draft,setDraft]=useState<Draft|null>(null)
  const recorder=useRef<MediaRecorder|null>(null)
  const stream=useRef<MediaStream|null>(null)
  const chunks=useRef<Blob[]>([])

  const active=useRef(true)
  useEffect(()=>{active.current=true;return()=>{active.current=false;if(recorder.current){recorder.current.onstop=null;if(recorder.current.state!=='inactive')recorder.current.stop()}stream.current?.getTracks().forEach(t=>t.stop())}},[])

  const analyze=async(payload:{audioBase64?:string;mimeType?:string;text?:string})=>{
    if(!supabase||!authUser){setStatus('Connect your cloud account to use AI voice logging.');return}
    setBusy(true);setStatus('Turning your recap into a session…')
    try{
      const {data,error}=await supabase.functions.invoke('voice-session',{body:{...payload,techniques:techniques.map(t=>({name:t.name,position:t.position,category:t.category}))}})
      if(error)throw error
      if(!active.current)return
      const draft=data?.session
      if(!draft||typeof draft!=='object')throw new Error('No session found. Try a more detailed recap.')
      for(const key of ['durationMin','rounds','positionalRounds','submissions','taps','rating'])if(draft[key]!=null&&(!Number.isInteger(draft[key])||draft[key]<0))throw new Error('AI returned invalid numbers. Please try again.')
      for(const key of ['partners','techniqueNames'])if(draft[key]!=null&&(!Array.isArray(draft[key])||draft[key].some((x:unknown)=>typeof x!=='string')))throw new Error('AI returned an invalid session. Please try again.')
      for(const key of ['notes','focusPosition'])if(draft[key]!=null&&typeof draft[key]!=='string')throw new Error('AI returned invalid notes. Please try again.')
      if(draft.mode&&!['Gi','No-Gi'].includes(draft.mode))draft.mode='Gi'
      if(draft.sessionType&&!['Class + Sparring','Open Mat','Positional','Drilling'].includes(draft.sessionType))draft.sessionType='Class + Sparring'
      setTranscript(data?.transcript||payload.text||'')
      setDraft(draft)
      setStatus('')
    }catch(e:any){setStatus(e?.message||'Could not analyze this session.')}
    finally{setBusy(false)}
  }

  const start=async()=>{
    if(busy||!authUser)return
    try{
      const media=await navigator.mediaDevices.getUserMedia({audio:true})
      if(!active.current){media.getTracks().forEach(t=>t.stop());return}
      stream.current=media;chunks.current=[]
      const r=new MediaRecorder(media)
      recorder.current=r
      r.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)}
      r.onstop=async()=>{
        const blob=new Blob(chunks.current,{type:r.mimeType||'audio/webm'})
        stream.current?.getTracks().forEach(t=>t.stop())
        if(!active.current)return
        if(blob.size>8*1024*1024){setStatus('Recording is too large. Try a shorter recap.');return}
        const base64=await blobToBase64(blob)
        await analyze({audioBase64:base64,mimeType:blob.type||'audio/webm'})
      }
      r.start();setRecording(true);setStatus('Recording… describe what happened naturally.')
    }catch{setStatus('Microphone access was blocked. You can type the recap instead.')}
  }

  const stop=()=>{recorder.current?.stop();setRecording(false)}

  const confirm=async()=>{
    if(!draft)return
    const techniqueIds=(draft.techniqueNames||[]).map(name=>techniques.find(t=>t.name.toLowerCase()===name.toLowerCase())?.id).filter(Boolean) as string[]
    await save({
      id:crypto.randomUUID(),trainedAt:localToday(),mode:draft.mode||'Gi',
      sessionType:draft.sessionType||'Class + Sparring',durationMin:draft.durationMin||90,rounds:draft.rounds||0,
      positionalRounds:draft.positionalRounds||0,submissions:draft.submissions||0,taps:draft.taps||0,
      rating:Math.min(5,Math.max(1,draft.rating||4)),focusPosition:draft.focusPosition||'',
      notes:draft.notes||transcript,techniqueIds,partners:draft.partners||[],createdAt:new Date().toISOString()
    })
    close()
  }

  return <Modal title="Log by voice or recap" close={close}>
    <p className="muted">{!authUser?'Sign in to use voice logging. ':''}Example: “No-gi open mat, 90 minutes, seven rounds. I worked bottom half and hit two sweeps…”</p>
    <button className={recording?'record-btn recording':'record-btn'} disabled={busy||!authUser} onClick={recording?stop:start}>{recording?<><Square size={22}/>Stop & analyze</>:<><Mic size={25}/>Start recording</>}</button>
    <div className="voice-or"><span>or type your recap</span></div>
    <textarea aria-label="Training recap" maxLength={20000} disabled={recording} value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Paste or type a quick recap…"/>
    <button disabled={busy||recording||!authUser||!transcript.trim()} onClick={()=>analyze({text:transcript})}><Sparkles size={16}/>{busy?'Analyzing…':'AI parse session'}</button>
    {status&&<p className="status">{status}</p>}
    {draft&&<div className="voice-preview">
      <small>AI DRAFT</small><h4>{draft.mode||'Gi'} · {draft.sessionType||'Class + Sparring'}</h4>
      <div className="review-grid"><div><small>Minutes</small><b>{draft.durationMin||0}</b></div><div><small>Rounds</small><b>{draft.rounds||0}</b></div><div><small>Subs</small><b>{draft.submissions||0}</b></div><div><small>Rating</small><b>{draft.rating||4}/5</b></div></div>
      {draft.focusPosition&&<p><b>Focus:</b> {draft.focusPosition}</p>}
      {draft.notes&&<p>{draft.notes}</p>}
      <ActionButton className="primary wide" disabled={busy||recording} onClick={confirm}>Save this session</ActionButton>
    </div>}
  </Modal>
}

function blobToBase64(blob:Blob):Promise<string>{
  return new Promise((resolve,reject)=>{
    const reader=new FileReader()
    reader.onload=()=>resolve(String(reader.result).split(',')[1]||'')
    reader.onerror=reject
    reader.readAsDataURL(blob)
  })
}
