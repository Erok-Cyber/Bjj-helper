import { useRef, useState } from 'react'
import { Mic, Square, Sparkles, X } from 'lucide-react'
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

  const analyze=async(payload:{audioBase64?:string;mimeType?:string;text?:string})=>{
    if(!supabase||!authUser){setStatus('Connect your cloud account to use AI voice logging.');return}
    setBusy(true);setStatus('Turning your recap into a session…')
    try{
      const {data,error}=await supabase.functions.invoke('voice-session',{body:{...payload,techniques:techniques.map(t=>({name:t.name,position:t.position,category:t.category}))}})
      if(error)throw error
      setTranscript(data?.transcript||payload.text||'')
      setDraft(data?.session||null)
      setStatus('')
    }catch(e:any){setStatus(e?.message||'Could not analyze this session.')}
    finally{setBusy(false)}
  }

  const start=async()=>{
    try{
      const media=await navigator.mediaDevices.getUserMedia({audio:true})
      stream.current=media;chunks.current=[]
      const r=new MediaRecorder(media)
      recorder.current=r
      r.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data)}
      r.onstop=async()=>{
        const blob=new Blob(chunks.current,{type:r.mimeType||'audio/webm'})
        stream.current?.getTracks().forEach(t=>t.stop())
        const base64=await blobToBase64(blob)
        await analyze({audioBase64:base64,mimeType:blob.type||'audio/webm'})
      }
      r.start();setRecording(true);setStatus('Recording… describe what happened naturally.')
    }catch{setStatus('Microphone access was blocked. You can type the recap instead.')}
  }

  const stop=()=>{recorder.current?.stop();setRecording(false)}

  const confirm=()=>{
    if(!draft)return
    const techniqueIds=(draft.techniqueNames||[]).map(name=>techniques.find(t=>t.name.toLowerCase()===name.toLowerCase())?.id).filter(Boolean) as string[]
    save({
      id:crypto.randomUUID(),trainedAt:new Date().toISOString().slice(0,10),mode:draft.mode||'Gi',
      sessionType:draft.sessionType||'Class + Sparring',durationMin:draft.durationMin||90,rounds:draft.rounds||0,
      positionalRounds:draft.positionalRounds||0,submissions:draft.submissions||0,taps:draft.taps||0,
      rating:Math.min(5,Math.max(1,draft.rating||4)),focusPosition:draft.focusPosition||'',
      notes:draft.notes||transcript,techniqueIds,partners:draft.partners||[],createdAt:new Date().toISOString()
    })
    close()
  }

  return <div className="modal-bg" onMouseDown={close}><section className="modal voice-modal" onMouseDown={e=>e.stopPropagation()}>
    <div className="modal-head"><div><span className="badge"><Mic size={13}/> VOICE LOG</span><h3>Tell me how training went</h3></div><button className="icon" onClick={close}><X size={18}/></button></div>
    <p className="muted">Example: “No-gi open mat, 90 minutes, seven rounds. I worked bottom half and hit two sweeps…”</p>
    <button className={recording?'record-btn recording':'record-btn'} disabled={busy} onClick={recording?stop:start}>{recording?<><Square size={22}/>Stop & analyze</>:<><Mic size={25}/>Start recording</>}</button>
    <div className="voice-or"><span>or type your recap</span></div>
    <textarea value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Paste or type a quick recap…"/>
    <button disabled={busy||!transcript.trim()} onClick={()=>analyze({text:transcript})}><Sparkles size={16}/>{busy?'Analyzing…':'AI parse session'}</button>
    {status&&<p className="status">{status}</p>}
    {draft&&<div className="voice-preview">
      <small>AI DRAFT</small><h4>{draft.mode||'Gi'} · {draft.sessionType||'Class + Sparring'}</h4>
      <div className="review-grid"><div><small>Minutes</small><b>{draft.durationMin||0}</b></div><div><small>Rounds</small><b>{draft.rounds||0}</b></div><div><small>Subs</small><b>{draft.submissions||0}</b></div><div><small>Rating</small><b>{draft.rating||4}/5</b></div></div>
      {draft.focusPosition&&<p><b>Focus:</b> {draft.focusPosition}</p>}
      {draft.notes&&<p>{draft.notes}</p>}
      <button className="primary wide" onClick={confirm}>Save this session</button>
    </div>}
  </section></div>
}

function blobToBase64(blob:Blob):Promise<string>{
  return new Promise((resolve,reject)=>{
    const reader=new FileReader()
    reader.onload=()=>resolve(String(reader.result).split(',')[1]||'')
    reader.onerror=reject
    reader.readAsDataURL(blob)
  })
}
