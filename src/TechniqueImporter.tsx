import Modal from './Modal'
import ActionButton from './ActionButton'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { Technique } from './types'
import { supabase } from './supabase'

type Imported = Pick<Technique,'name'|'category'|'position'|'giMode'|'notes'|'tags'|'confidence'>

export default function TechniqueImporter({authUser,close,saveMany}:{authUser:string|null;close:()=>void;saveMany:(items:Technique[])=>Promise<void>|void}) {
  const [text,setText]=useState('')
  const [items,setItems]=useState<Imported[]>([])
  const [busy,setBusy]=useState(false)
  const [status,setStatus]=useState('')

  const parseLocal=(raw:string):Imported[]=>raw.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,40).map(line=>({
    name:line.replace(/^[-*\d.\s]+/,'').slice(0,90),category:'Other',position:'',giMode:'Both',notes:'',tags:[],confidence:2
  }))

  const analyze=async()=>{
    if(busy||!text.trim())return
    setBusy(true);setStatus('')
    try{
      if(supabase&&authUser){
        const {data,error}=await supabase.functions.invoke('smart-import',{body:{text}})
        if(error)throw error
        if(!Array.isArray(data?.techniques)||data.techniques.some((t:any)=>typeof t?.name!=='string'||!t.name.trim()))throw new Error('AI returned an invalid list. Please try again.')
        setItems(data.techniques.slice(0,40).map((t:any)=>({...t,category:['Takedown','Guard','Pass','Sweep','Escape','Submission','Control','Defense','Transition','Other'].includes(t.category)?t.category:'Other',giMode:['Gi','No-Gi','Both'].includes(t.giMode)?t.giMode:'Both',position:typeof t.position==='string'?t.position:'',notes:typeof t.notes==='string'?t.notes:'',tags:Array.isArray(t.tags)?t.tags.filter((x:any)=>typeof x==='string'):[],confidence:Number.isInteger(t.confidence)?Math.min(5,Math.max(1,t.confidence)):2})))
      }else{
        setItems(parseLocal(text));setStatus('Local mode: imported as simple entries. Cloud AI adds categories, positions and tags.')
      }
    }catch(e:any){setStatus(e?.message||'Could not import techniques.')}
    finally{setBusy(false)}
  }

  const commit=async()=>{
    const stamp=new Date().toISOString()
    const full:Technique[]=items.filter(x=>x.name?.trim()).map(x=>({
      id:crypto.randomUUID(),name:x.name.trim(),category:x.category||'Other',position:x.position||'',
      giMode:x.giMode||'Both',notes:x.notes||'',videoUrl:'',tags:x.tags||[],confidence:x.confidence||2,
      drillingCount:0,isFavorite:false,inDrillQueue:false,createdAt:stamp,updatedAt:stamp
    }))
    await saveMany(full);close()
  }

  return <Modal title="Import techniques" close={close}>
    <p className="muted">Paste notes from Apple Notes, Notion, a coach recap or a messy list. AI will separate techniques and infer useful metadata.</p>
    <textarea aria-label="Technique notes to import" maxLength={20000} className="import-text" value={text} onChange={e=>setText(e.target.value)} placeholder={"Example:\nHalf guard: knee shield -> underhook -> dogfight\nArm triangle from mount - walk elbow up first\nSasae when opponent pushes back"}/>
    <button className="primary" disabled={busy||!text.trim()} onClick={analyze}><Sparkles size={16}/>{busy?'Reading notes…':'Analyze notes'}</button>
    {status&&<p className="status">{status}</p>}
    {items.length>0&&<div className="import-preview">
      <div className="between"><small>{items.length} TECHNIQUES FOUND</small><ActionButton className="primary" disabled={busy} onClick={commit}>Import all</ActionButton></div>
      <div className="rows">{items.map((t,i)=><div className="import-row" key={i}><div><b>{t.name}</b><small>{t.category} · {t.position||'Position unknown'} · {t.giMode}</small></div><span className="tag">{t.confidence||2}/5</span></div>)}</div>
    </div>}
  </Modal>
}
