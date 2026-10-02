import { localToday, recentSessions, monday } from './dates'
import { useEffect, useMemo, useState } from 'react'
import { Brain, ChevronRight, Target } from 'lucide-react'
import type { AppData } from './types'
import { supabase } from './supabase'
import { buildLocalWeeklyFocus } from './localBjjCoach'
import { cleanAIText } from './cleanAIText'
import { weekLabel } from './weekLabel'

type Priority={
  title:string
  why:string
  drills:string[]
  live_goal:string
  techniques:string[]
  systems:string[]
}
type Focus={
  week_start:string
  summary:string
  priorities:Priority[]
}

export default function HomeWeeklyFocus({data,authUser,openAnalytics}:{data:AppData;authUser:string|null;openAnalytics:()=>void}){
  const [focus,setFocus]=useState<Focus|null>(null)
  const recent=useMemo(()=>recentSessions(data.sessions),[data.sessions])

  useEffect(()=>{
    let cancelled=false
    const run=async()=>{
      if(!recent.length){setFocus(null);return}

      setFocus(buildLocalWeeklyFocus(data,localToday(),navigator.language||'en') as Focus)
      if(supabase&&authUser){
        const {data:r}=await supabase
          .from('weekly_focuses')
          .select('week_start,summary,priorities')
          .eq('user_id',authUser)
          .gte('week_start',monday(localToday()))
          .order('week_start',{ascending:false})
          .limit(1)
          .maybeSingle()
        if(!cancelled&&r?.priorities?.length){
          setFocus(r as Focus)
          return
        }
      }

      const local=buildLocalWeeklyFocus(data,localToday(),navigator.language||'sv-SE')
      if(!cancelled)setFocus(local as Focus)
    }
    void run().catch(()=>{/* Local focus is already available if cloud is unreachable. */})
    return()=>{cancelled=true}
  },[authUser,data,recent.length])

  const p=focus?.priorities?.[0]
  if(!recent.length)return null

  return <section className="card home-weekly-focus">
    <div className="head">
      <div><small>{focus?weekLabel(focus.week_start):'FOCUS OF THE WEEK'}</small><h3>{p?.title||'Building your focus…'}</h3></div>
      <button className="link" onClick={openAnalytics}>Full plan<ChevronRight size={14}/></button>
    </div>
    {p&&<>
      <p>{cleanAIText(p.why||focus?.summary||'')}</p>
      <div className="home-focus-grid">
        <div>
          <small>DRILL</small>
          {(p.drills||[]).slice(0,2).map((d,i)=><span key={i}>{i+1}. {cleanAIText(d)}</span>)}
        </div>
        <div className="home-live-goal">
          <Target size={16}/>
          <span><small>LIVE ROUND GOAL</small><b>{cleanAIText(p.live_goal)}</b></span>
        </div>
      </div>
      {(p.techniques?.length>0||p.systems?.length>0)&&<div className="chips">
        {p.techniques?.slice(0,3).map(x=><span className="tag selected" key={'t'+x}>{x}</span>)}
        {p.systems?.slice(0,2).map(x=><span className="tag blue" key={'s'+x}>{x}</span>)}
      </div>}
    </>}
    {!p&&<div className="home-focus-loading"><Brain size={17}/>Reading your latest sessions…</div>}
  </section>
}
