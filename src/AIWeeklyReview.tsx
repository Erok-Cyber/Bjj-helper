import { useMemo, useState } from 'react'
import { Brain, Sparkles } from 'lucide-react'
import type { AppData } from './types'
import { supabase } from './supabase'

export default function AIWeeklyReview({data,authUser}:{data:AppData;authUser:string|null}) {
  const [review,setReview]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  const summary=useMemo(()=>{
    const now=Date.now()
    const current=data.sessions.filter(s=>now-new Date(s.trainedAt).getTime()<7*864e5)
    const previous=data.sessions.filter(s=>{
      const age=now-new Date(s.trainedAt).getTime()
      return age>=7*864e5&&age<14*864e5
    })
    const stats=(sessions:typeof data.sessions)=>({
      sessions:sessions.length,
      minutes:sessions.reduce((a,s)=>a+s.durationMin,0),
      rounds:sessions.reduce((a,s)=>a+s.rounds,0),
      positionalRounds:sessions.reduce((a,s)=>a+s.positionalRounds,0),
      submissions:sessions.reduce((a,s)=>a+s.submissions,0),
      taps:sessions.reduce((a,s)=>a+s.taps,0),
      avgRating:sessions.length?Number((sessions.reduce((a,s)=>a+s.rating,0)/sessions.length).toFixed(1)):null,
      focuses:[...new Set(sessions.map(s=>s.focusPosition).filter(Boolean))]
    })
    return {current:stats(current),previous:stats(previous),currentSessions:current,previousSessions:previous}
  },[data.sessions])

  const generate=async()=>{
    setBusy(true);setError('')
    try{
      if(!supabase||!authUser)throw new Error('Connect a cloud account to generate AI weekly reviews.')
      const question='Create my BJJ weekly review. Compare the last 7 days with the 7 days before that. Give me: 1) What improved or changed, based only on the logged data. 2) The biggest gap or risk in my current training. 3) Exactly one technical focus and one training-behavior focus for next week. 4) If I have a competition date, connect the advice to that camp. Keep it concise and specific. Do not invent techniques or results.'
      const {data:r,error:e}=await supabase.functions.invoke('ai-coach',{body:{question,context:{
        profile:data.profile,
        weeklyComparison:summary,
        techniques:data.techniques.slice(0,80),
        flows:data.flows.slice(0,8)
      }}})
      if(e)throw e
      setReview(r?.answer||'No review returned.')
    }catch(e:any){setError(e?.message||'Could not generate review.')}
    finally{setBusy(false)}
  }

  return <section className="card ai-weekly">
    <div className="head"><div><small>AI WEEKLY REVIEW</small><h3>Coach review</h3></div><button className="primary" disabled={busy} onClick={generate}><Brain size={15}/>{busy?'Reviewing…':'Generate review'}</button></div>
    <p className="muted">Compares this week with the previous week and uses your rank, focus, techniques and competition plan as context.</p>
    {error&&<p className="status">{error}</p>}
    {review?<div className="ai-review-text">{review}</div>:<div className="ai-review-empty"><Sparkles size={18}/><span>No AI review generated yet.</span></div>}
  </section>
}
