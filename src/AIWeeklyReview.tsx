import { useEffect, useMemo, useRef, useState } from 'react'
import { Brain, CheckCircle2, ChevronRight, Sparkles, Target } from 'lucide-react'
import type { AppData } from './types'
import { supabase } from './supabase'
import { buildLocalWeeklyFocus } from './localBjjCoach'

type Pattern = {
  theme: string
  evidence: string
  count: number
}

type Priority = {
  title: string
  why: string
  drills: string[]
  live_goal: string
  techniques: string[]
  systems: string[]
}

type WeeklyFocus = {
  id: string
  week_start: string
  source_week_start: string
  source_week_end: string
  summary: string
  patterns: Pattern[]
  priorities: Priority[]
  created_at: string
  updated_at: string
}

const localDate=()=>{
  const d=new Date()
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

const fmtDate=(value:string)=>new Intl.DateTimeFormat('sv-SE',{day:'numeric',month:'short'}).format(new Date(value+'T12:00:00'))

export default function AIWeeklyReview({data,authUser}:{data:AppData;authUser:string|null}) {
  const [focus,setFocus]=useState<WeeklyFocus|null>(null)
  const [busy,setBusy]=useState(false)
  const [loading,setLoading]=useState(Boolean(authUser))
  const [error,setError]=useState('')
  const [engine,setEngine]=useState<'cloud'|'hybrid'|null>(null)
  const autoTried=useRef(false)

  const recentSessions=useMemo(()=>{
    const now=Date.now()
    return data.sessions.filter(s=>now-new Date(s.trainedAt+'T12:00:00').getTime()<8*864e5)
  },[data.sessions])

  const loadLatest=async()=>{
    if(!supabase||!authUser){setLoading(false);return null}
    setLoading(true)
    const {data:r,error:e}=await supabase
      .from('weekly_focuses')
      .select('*')
      .order('week_start',{ascending:false})
      .limit(1)
      .maybeSingle()
    setLoading(false)
    if(e){setError(e.message);return null}
    const row=(r as WeeklyFocus|null)||null
    setFocus(row)
    return row
  }

  useEffect(()=>{void loadLatest()},[authUser])

  const generate=async(silent=false)=>{
    setBusy(true)
    if(!silent)setError('')
    try{
      if(supabase&&authUser){
        const {data:r,error:e}=await supabase.functions.invoke('weekly-focus',{
          body:{today:localDate(),locale:navigator.language||'sv-SE'}
        })
        if(!e&&r?.focus){
          setFocus(r.focus as WeeklyFocus)
          setEngine('cloud')
          return
        }
      }

      const local=buildLocalWeeklyFocus(data,localDate(),navigator.language||'sv-SE')
      setFocus(local as WeeklyFocus)
      setEngine('hybrid')

      if(supabase&&authUser){
        const {error:saveError}=await supabase.from('weekly_focuses').upsert({
          id:local.id,
          user_id:authUser,
          week_start:local.week_start,
          source_week_start:local.source_week_start,
          source_week_end:local.source_week_end,
          summary:local.summary,
          patterns:local.patterns,
          priorities:local.priorities,
          updated_at:local.updated_at
        },{onConflict:'user_id,week_start'})
        if(saveError)console.warn('Could not persist hybrid weekly focus',saveError)
      }
    }catch(e:any){
      const message=e?.context?.body?.message||e?.message||'Could not generate weekly focus.'
      if(!silent)setError(message)
    }finally{setBusy(false)}
  }

  useEffect(()=>{
    if(autoTried.current||loading||busy||!authUser||focus||!recentSessions.length)return
    const day=new Date().getDay()
    if(day===0||day===1){
      autoTried.current=true
      void generate(true)
    }
  },[loading,busy,authUser,focus,recentSessions.length])

  const title=focus?('Week of '+fmtDate(focus.week_start)):'Next week focus'

  return <section className="card ai-weekly weekly-focus-card">
    <div className="head">
      <div><small>AI WEEKLY FOCUS</small><h3>{title}</h3></div>
      <button className="primary" disabled={busy||loading||!recentSessions.length} onClick={()=>generate(false)}>
        <Brain size={15}/>{busy?'Building plan…':focus?'Regenerate':'Generate next week'}
      </button>
    </div>

    <p className="muted">
      Reads your session notes, “what worked / failed / next focus”, technique confidence, drill queue and gameplans to find recurring themes.
    </p>

    {loading&&<div className="ai-review-empty"><Sparkles size={18}/><span>Loading saved weekly focus…</span></div>}
    {!loading&&!recentSessions.length&&<div className="ai-review-empty"><Target size={18}/><span>Log at least one session this week to build a useful focus.</span></div>}
    {error&&<p className="status">{error}</p>}

    {focus&&<>
      <div className="weekly-focus-source">
        <CheckCircle2 size={15}/>
        <span>Built from {fmtDate(focus.source_week_start)}–{fmtDate(focus.source_week_end)} · {engine==='hybrid'?'Hybrid local coach':'Cloud AI'} · saved to your account</span>
      </div>

      <div className="weekly-focus-summary">{focus.summary}</div>

      {focus.patterns?.length>0&&<div className="weekly-patterns">
        <small>PATTERNS FROM YOUR NOTES</small>
        <div className="weekly-pattern-grid">
          {focus.patterns.map((p,i)=><article key={i}>
            <div><b>{p.theme}</b><span>{p.count}× signal</span></div>
            <p>{p.evidence}</p>
          </article>)}
        </div>
      </div>}

      <div className="weekly-priorities">
        <small>NEXT WEEK PRIORITIES</small>
        {focus.priorities?.map((p,i)=><article className="weekly-priority" key={i}>
          <div className="weekly-priority-number">{i+1}</div>
          <div className="weekly-priority-body">
            <h4>{p.title}</h4>
            <p>{p.why}</p>

            {p.drills?.length>0&&<div className="weekly-drills">
              <b>Drill</b>
              {p.drills.map((d,n)=><span key={n}><ChevronRight size={13}/>{d}</span>)}
            </div>}

            {p.live_goal&&<div className="weekly-live-goal"><Target size={15}/><span><small>LIVE ROUND GOAL</small><b>{p.live_goal}</b></span></div>}

            {(p.techniques?.length>0||p.systems?.length>0)&&<div className="chips weekly-linked">
              {p.techniques?.map(x=><span className="tag selected" key={'t'+x}>{x}</span>)}
              {p.systems?.map(x=><span className="tag blue" key={'s'+x}>{x}</span>)}
            </div>}
          </div>
        </article>)}
      </div>
    </>}
  </section>
}
