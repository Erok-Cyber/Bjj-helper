import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  Activity, ArrowLeft, BarChart3, BookOpen, Brain, ChevronDown, ChevronRight, CirclePlus, Clock3,
  ExternalLink, GitBranch, Home, Link2, LogOut, Menu, Pencil, Search, Sparkles, Star, Swords, Target,
  Shuffle, Trash2, Trophy, Undo2, Redo2, CheckCircle2, AlertCircle, UserRound, WifiOff, X
} from 'lucide-react'
import {
  Background, Controls, MarkerType, MiniMap, ReactFlow, addEdge,
  applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange
} from '@xyflow/react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { AppData, Flow, Session, Technique } from './types'
import { cloudDelete, cloudUpsert, loadCloud, loadLocal, saveLocal } from './store'
import { cloudEnabled, supabase } from './supabase'
import { AuthGate, Onboarding } from './FirstRun'
import VoiceSessionLogger from './VoiceSessionLogger'
import TechniqueImporter from './TechniqueImporter'
import AIWeeklyReview from './AIWeeklyReview'
import { localCoachAnswer } from './localBjjCoach'
import { catalogCounts, catalogSystems, catalogTechniques, cloneSystem, toPersonalTechnique, type CatalogSystem, type CatalogTechnique } from './catalog'

type Tab = 'home'|'sessions'|'techniques'|'flows'|'analytics'|'coach'|'profile'
const uid=()=>crypto.randomUUID()
const now=()=>new Date().toISOString()
const today=()=>now().slice(0,10)
const fmt=(d:string)=>new Intl.DateTimeFormat('sv-SE',{day:'numeric',month:'short'}).format(new Date(d+'T12:00:00'))

const nav=[
  ['home','Home',Home],['sessions','Sessions',Activity],['techniques','Library',BookOpen],
  ['flows','Gameplan',GitBranch],['analytics','Analytics',BarChart3],['coach','AI Coach',Brain]
] as const

export default function App(){
  const [data,setData]=useState<AppData>(()=>loadLocal())
  const [tab,setTab]=useState<Tab>('home')
  const [menu,setMenu]=useState(false)
  const [authUser,setAuthUser]=useState<string|null>(null)
  const [syncState,setSyncState]=useState<'idle'|'syncing'|'synced'|'error'>('idle')
  const [authChecked,setAuthChecked]=useState(!cloudEnabled)

  useEffect(()=>{
    if(!supabase)return
    let hideTimer:number|undefined
    const syncCloud=async(id:string)=>{
      setSyncState('syncing')
      try{
        setData(await loadCloud(id))
        setSyncState('synced')
        window.clearTimeout(hideTimer)
        hideTimer=window.setTimeout(()=>setSyncState('idle'),1600)
      }catch(e){
        console.error(e)
        setSyncState('error')
      }
    }
    supabase.auth.getSession().then(async({data:{session}})=>{
      const id=session?.user.id||null; setAuthUser(id)
      if(id)await syncCloud(id)
      setAuthChecked(true)
    })
    const {data:sub}=supabase.auth.onAuthStateChange(async(_e,session)=>{
      const id=session?.user.id||null;setAuthUser(id);setAuthChecked(true)
      if(id)await syncCloud(id)
      else setSyncState('idle')
    })
    return()=>{sub.subscription.unsubscribe();window.clearTimeout(hideTimer)}
  },[])

  useEffect(()=>{if(!authUser)saveLocal(data)},[data,authUser])
  const update=(fn:(d:AppData)=>AppData)=>setData(d=>fn(d))
  const finishOnboarding=async(profile:AppData['profile'])=>{
    update((d:AppData)=>({...d,profile}))
    if(authUser)await cloudUpsert('profile',profile)
    else saveLocal({...data,profile})
  }

  if(!authChecked)return <main className="first-run"><div className="loading-mark"><Swords size={24}/>Loading BJJ Helper…</div></main>
  if(cloudEnabled&&!authUser)return <AuthGate/>
  if(!data.profile.onboardingCompleted)return <Onboarding profile={data.profile} cloud={Boolean(authUser)} onComplete={finishOnboarding}/>

  return <div className="app">
    <aside className="side">
      <Brand/>
      <Nav tab={tab} setTab={setTab}/>
      <button className="user-card" onClick={()=>setTab('profile')}>
        <span className="avatar">{data.profile.displayName.slice(0,1).toUpperCase()}</span>
        <span><b>{data.profile.displayName}</b><small>{data.profile.belt} belt · {data.profile.stripes} stripes</small></span>
        <i className={authUser?'dot on':'dot'}/>
      </button>
    </aside>

    <main>
      <header className="top">
        <button className="icon mobile" onClick={()=>setMenu(true)}><Menu size={20}/></button>
        <div><small>{authUser?'PRIVATE CLOUD PROFILE':'LOCAL-FIRST PROFILE'}</small><h1>{nav.find(n=>n[0]===tab)?.[1]||'Profile'}</h1></div>
        <div className="top-right">
          {!authUser&&<span className="pill"><WifiOff size={13}/> Local</span>}
          {authUser&&syncState==='syncing'&&<span className="pill sync-pill">Loading cloud…</span>}
          {authUser&&syncState==='synced'&&<span className="pill sync-pill success"><CheckCircle2 size={13}/>Synced</span>}
          {authUser&&syncState==='error'&&<button className="pill sync-pill error" onClick={()=>window.location.reload()}><AlertCircle size={13}/>Sync failed · Retry</button>}
          <button className="avatar" onClick={()=>setTab('profile')}>{data.profile.displayName.slice(0,1).toUpperCase()}</button>
        </div>
      </header>
      <div className="page">
        {tab==='home'&&<Dashboard data={data} go={setTab}/>}
        {tab==='sessions'&&<Sessions data={data} update={update} authUser={authUser}/>}
        {tab==='techniques'&&<Techniques data={data} update={update} authUser={authUser}/>}
        {tab==='flows'&&<Flows data={data} update={update} authUser={authUser}/>}
        {tab==='analytics'&&<Analytics data={data} authUser={authUser}/>}
        {tab==='coach'&&<Coach data={data} authUser={authUser}/>}
        {tab==='profile'&&<Profile data={data} update={update} authUser={authUser} setAuthUser={setAuthUser}/>}
      </div>
    </main>

    <nav className="bottom">{nav.slice(0,5).map(([id,label,I])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id as Tab)}><I size={19}/><span>{label}</span></button>)}</nav>
    {menu&&<div className="scrim" onClick={()=>setMenu(false)}><div className="drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><Brand/><button className="icon" onClick={()=>setMenu(false)}><X size={18}/></button></div><Nav tab={tab} setTab={(t)=>{setTab(t);setMenu(false)}}/><button className="nav-btn" onClick={()=>{setTab('profile');setMenu(false)}}><UserRound size={18}/>Profile</button></div></div>}
  </div>
}

function Brand(){return <div className="brand"><span><Swords size={20}/></span><div><b>BJJ Helper</b><small>Train smarter</small></div></div>}
function Nav({tab,setTab}:{tab:Tab;setTab:(t:Tab)=>void}){return <nav className="nav">{nav.map(([id,label,I])=><button key={id} className={tab===id?'nav-btn active':'nav-btn'} onClick={()=>setTab(id as Tab)}><I size={18}/>{label}</button>)}</nav>}
function Empty({children}:{children:string}){return <div className="empty">{children}</div>}
function Metric({icon:I,label,value,hint}:{icon:any;label:string;value:string;hint:string}){return <div className="metric"><span><I size={18}/></span><div><small>{label}</small><b>{value}</b><em>{hint}</em></div></div>}
function Modal({title,close,children}:{title:string;close:()=>void;children:any}){
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')close()}
    window.addEventListener('keydown',onKey)
    return()=>window.removeEventListener('keydown',onKey)
  },[close])
  return <div className="modal-bg" onMouseDown={close}><section className="modal" onMouseDown={e=>e.stopPropagation()}>
    <div className="modal-head">
      <button className="icon modal-back" onClick={close} aria-label="Back"><ArrowLeft size={18}/></button>
      <h3>{title}</h3>
      <button className="icon" onClick={close} aria-label="Close"><X size={18}/></button>
    </div>
    {children}
  </section></div>
}
function Field({label,children}:{label:string;children:any}){return <label className="field"><span>{label}</span>{children}</label>}

function Dashboard({data,go}:{data:AppData;go:(t:Tab)=>void}){
  const week=data.sessions.filter(s=>Date.now()-new Date(s.trainedAt).getTime()<7*864e5)
  const minutes=week.reduce((a,s)=>a+s.durationMin,0)
  const rounds=week.reduce((a,s)=>a+s.rounds,0)
  const avg=week.length?week.reduce((a,s)=>a+s.rating,0)/week.length:0
  const low=[...data.techniques].sort((a,b)=>a.confidence-b.confidence).slice(0,3)
  const drillQueue=data.techniques.filter(t=>t.inDrillQueue).slice(0,3)
  const recentTechniqueIds=[...data.sessions]
    .sort((a,b)=>b.trainedAt.localeCompare(a.trainedAt))
    .flatMap(s=>s.techniqueIds)
    .filter((id,i,a)=>a.indexOf(id)===i)
    .slice(0,4)
  const recentTechniques=recentTechniqueIds.map(id=>data.techniques.find(t=>t.id===id)).filter(Boolean) as Technique[]
  const aGame=data.techniques.filter(t=>t.isFavorite).sort((a,b)=>b.confidence-a.confidence).slice(0,4)
  const goal=Math.max(1,data.profile.weeklySessionGoal||3)
  const goalPct=Math.min(100,Math.round((week.length/goal)*100))
  const daysToComp=data.profile.competitionDate?Math.ceil((new Date(data.profile.competitionDate+'T12:00:00').getTime()-Date.now())/864e5):null
  return <div className="stack">
    <section className="hero"><div><span className="badge"><Sparkles size={13}/> PERSONAL BJJ OS</span><h2>Build a game you can actually execute.</h2><p>Track what happens on the mat, connect techniques into systems and train the decisions between them.</p><div className="actions"><button className="primary" onClick={()=>go('sessions')}><CirclePlus size={17}/>Log session</button><button onClick={()=>go('coach')}><Brain size={17}/>Ask AI coach</button></div></div><div className="hero-score"><b>{week.length}</b><span>sessions<br/>this week</span></div></section>
    <section className="metrics"><Metric icon={Clock3} label="Mat time" value={(minutes/60).toFixed(1)+'h'} hint="Last 7 days"/><Metric icon={Activity} label="Rounds" value={String(rounds)} hint="Last 7 days"/><Metric icon={BookOpen} label="Techniques" value={String(data.techniques.length)} hint="Your library"/><Metric icon={Star} label="Session feel" value={avg?avg.toFixed(1):'–'} hint="Average / 5"/></section>
    <div className="cols focus-grid">
      <section className="card focus-card"><Head eyebrow="WEEKLY TARGET" title={week.length+' / '+goal+' sessions'} action="Edit" click={()=>go('profile')}/><div className="goalbar"><i style={{width:goalPct+'%'}}/></div><p>{goalPct>=100?'Goal hit. Keep quality high rather than adding junk volume.':(goal-week.length)+' session'+(goal-week.length===1?'':'s')+' left to hit your target.'}</p><div className="focus-line"><Target size={16}/><span><small>Current focus</small><b>{data.profile.focusPosition||'Choose one position to own this week'}</b></span></div></section>
      <section className="card focus-card"><Head eyebrow="COMPETITION MODE" title={data.profile.competitionDate?'Next event':'No event set'} action="Plan" click={()=>go('profile')}/>{daysToComp!==null?<><div className="countdown"><b>{Math.max(0,daysToComp)}</b><span>days to competition</span></div><p>{data.profile.competitionWeight?'Target: '+data.profile.competitionWeight:'Add your target division/weight in Profile.'}</p></>:<Empty>Add an event date when you want the app to start thinking like a camp.</Empty>}</section>
    </div>
    <div className="cols">
      <section className="card"><Head eyebrow="RECENT" title="Training sessions" action="View all" click={()=>go('sessions')}/>{data.sessions.length?<div className="rows">{[...data.sessions].sort((a,b)=>b.trainedAt.localeCompare(a.trainedAt)).slice(0,4).map(s=><div className="row" key={s.id}><span className="date"><b>{new Date(s.trainedAt).getDate()}</b><small>{fmt(s.trainedAt).split(' ')[1]}</small></span><div><b>{s.mode} · {s.durationMin} min</b><small>{s.rounds} rounds · {s.submissions} submissions</small></div><strong>★ {s.rating}</strong></div>)}</div>:<Empty>Log your first session to start building trends.</Empty>}</section>
      <section className="card"><Head eyebrow="NEXT UP" title={drillQueue.length?'Drill queue':'Skill gaps'} action="Library" click={()=>go('techniques')}/>{(drillQueue.length?drillQueue:low).length?<div className="rows">{(drillQueue.length?drillQueue:low).map(t=><div className="row" key={t.id}><span className="confidence"><i style={{width:(t.confidence*20)+'%'}}/></span><div><b>{t.name}</b><small>{t.position||'No position'} · {t.category}</small></div><span className="tag">{drillQueue.length?'Drill':t.confidence+'/5'}</span></div>)}</div>:<Empty>Add techniques and rate confidence to reveal gaps.</Empty>}</section>
    </div>
    <div className="cols home-tech-cards">
      <section className="card"><Head eyebrow="RECENTLY TRAINED" title="Techniques in your latest sessions" action="Library" click={()=>go('techniques')}/>{recentTechniques.length?<div className="rows">{recentTechniques.map(t=><div className="row" key={t.id}><span className={'catalog-dot '+t.category.toLowerCase().replace(/\s/g,'-')}/><div><b>{t.name}</b><small>{t.category} · {t.position||'No position'}</small></div><span className="tag">{t.confidence}/5</span></div>)}</div>:<Empty>Tag techniques in your sessions and they will appear here.</Empty>}</section>
      <section className="card"><Head eyebrow="A-GAME" title="Your highest-priority techniques" action="Library" click={()=>go('techniques')}/>{aGame.length?<div className="rows">{aGame.map(t=><div className="row" key={t.id}><Star size={16} className="a-game-star"/><div><b>{t.name}</b><small>{t.category} · drilled {t.drillingCount}×</small></div><span className="tag">{t.confidence}/5</span></div>)}</div>:<Empty>Mark reliable techniques as A-game to build a focused competition-ready system.</Empty>}</section>
    </div>
    <section className="card"><Head eyebrow="YOUR SYSTEM" title="Gameplan flows" action="Open builder" click={()=>go('flows')}/><div className="flow-list">{data.flows.map(f=><div className="flow-mini" key={f.id}><GitBranch size={18}/><div><b>{f.name}</b><small>{f.nodes.length} nodes · {f.edges.length} links · {flowTechniqueMatches(f,data.techniques).length} techniques</small></div></div>)}</div></section>
  </div>
}
function Head({eyebrow,title,action,click}:{eyebrow:string;title:string;action:string;click:()=>void}){return <div className="head"><div><small>{eyebrow}</small><h3>{title}</h3></div><button className="link" onClick={click}>{action}<ChevronRight size={14}/></button></div>}

function Sessions({data,update,authUser}:{data:AppData;update:any;authUser:string|null}){
  const [open,setOpen]=useState(false),[voiceOpen,setVoiceOpen]=useState(false),[q,setQ]=useState('')
  const [reviewSession,setReviewSession]=useState<Session|null>(null)
  const list=[...data.sessions].filter(s=>(s.notes+' '+s.mode+' '+(s.whatWorked||'')+' '+(s.whatFailed||'')+' '+(s.nextFocus||'')).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>b.trainedAt.localeCompare(a.trainedAt))
  const add=async(s:Session)=>{
    update((d:AppData)=>({...d,sessions:[s,...d.sessions]}))
    setOpen(false);setVoiceOpen(false);setReviewSession(s)
    if(authUser)await cloudUpsert('session',s)
  }
  const updateSession=async(next:Session)=>{
    update((d:AppData)=>({...d,sessions:d.sessions.map(s=>s.id===next.id?next:s)}))
    setReviewSession(null)
    if(authUser)await cloudUpsert('session',next)
  }
  const del=async(id:string)=>{update((d:AppData)=>({...d,sessions:d.sessions.filter(s=>s.id!==id)}));if(authUser)await cloudDelete('sessions',id)}
  return <div className="stack">
    <Title eyebrow="TRAINING JOURNAL" title="Sessions" text="Log fast, then capture the one or two lessons that should influence your next class.">
      <div className="actions"><button onClick={()=>setVoiceOpen(true)}>🎙 Voice log</button><button className="primary" onClick={()=>setOpen(true)}><CirclePlus size={17}/>New session</button></div>
    </Title>
    <div className="filter"><div className="search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search sessions…"/></div><span className="pill">{list.length} logged</span></div>
    <div className="grid3">{list.length?list.map(s=><article className="session" key={s.id}>
      <div className="between"><div className="chips"><span className={s.mode==='Gi'?'tag blue':'tag purple'}>{s.mode}</span><span className="tag">{s.sessionType}</span></div><button className="icon danger" onClick={()=>del(s.id)}><X size={15}/></button></div>
      <h3>{fmt(s.trainedAt)}</h3>
      <div className="session-stats"><span><b>{s.durationMin}</b>min</span><span><b>{s.rounds}</b>rounds</span><span><b>{s.positionalRounds}</b>pos.</span><span><b>{s.submissions}</b>subs</span></div>
      {s.focusPosition&&<p className="session-focus"><Target size={13}/>{s.focusPosition}</p>}
      <div className="stars">{[1,2,3,4,5].map(n=><i className={n<=s.rating?'on':''} key={n}>★</i>)}</div>
      {s.notes&&<p>{s.notes}</p>}
      {(s.whatWorked||s.whatFailed||s.nextFocus)&&<div className="session-review-mini">
        {s.whatWorked&&<span><b>Worked</b>{s.whatWorked}</span>}
        {s.nextFocus&&<span><b>Next</b>{s.nextFocus}</span>}
      </div>}
      <div className="chips">{s.techniqueIds.map(id=>{const t=data.techniques.find(x=>x.id===id);return t?<span className="tag" key={id}>{t.name}</span>:null})}</div>
    </article>):<Empty>No sessions yet.</Empty>}</div>
    {open&&<SessionForm techniques={data.techniques} close={()=>setOpen(false)} save={add}/>}
    {voiceOpen&&<VoiceSessionLogger techniques={data.techniques} authUser={authUser} close={()=>setVoiceOpen(false)} save={add}/>}
    {reviewSession&&<PostSessionReview session={data.sessions.find(s=>s.id===reviewSession.id)||reviewSession} close={()=>setReviewSession(null)} save={updateSession}/>}
  </div>
}

function SessionForm({techniques,close,save}:{techniques:Technique[];close:()=>void;save:(s:Session)=>void}){
  const [f,setF]=useState({
    trainedAt:today(),mode:'Gi' as 'Gi'|'No-Gi',sessionType:'Class + Sparring' as Session['sessionType'],
    durationMin:'90',rounds:'5',positionalRounds:'0',submissions:'0',taps:'0',
    rating:4,focusPosition:'',notes:'',techniqueIds:[] as string[],partners:''
  })
  const templates=[
    {name:'Gi class',mode:'Gi' as const,type:'Class + Sparring' as const,min:'90',rounds:'5',pos:'0'},
    {name:'No-Gi class',mode:'No-Gi' as const,type:'Class + Sparring' as const,min:'90',rounds:'5',pos:'0'},
    {name:'Gi open mat',mode:'Gi' as const,type:'Open Mat' as const,min:'90',rounds:'8',pos:'0'},
    {name:'No-Gi open mat',mode:'No-Gi' as const,type:'Open Mat' as const,min:'90',rounds:'8',pos:'0'},
    {name:'Positional',mode:f.mode,type:'Positional' as const,min:'60',rounds:'6',pos:'6'},
    {name:'Drilling',mode:f.mode,type:'Drilling' as const,min:'60',rounds:'0',pos:'0'}
  ]
  const applyTemplate=(t:(typeof templates)[number])=>setF(v=>({...v,mode:t.mode,sessionType:t.type,durationMin:t.min,rounds:t.rounds,positionalRounds:t.pos}))
  const toggle=(id:string)=>setF(v=>({...v,techniqueIds:v.techniqueIds.includes(id)?v.techniqueIds.filter(x=>x!==id):[...v.techniqueIds,id]}))
  const numberField=(key:'durationMin'|'rounds'|'positionalRounds'|'submissions'|'taps')=>(e:ChangeEvent<HTMLInputElement>)=>{
    const value=e.target.value
    if(value===''||/^\d+$/.test(value))setF(v=>({...v,[key]:value}))
  }
  const n=(value:string)=>Math.max(0,Number(value||0))
  const submit=()=>save({
    id:uid(),trainedAt:f.trainedAt,mode:f.mode,sessionType:f.sessionType,
    durationMin:n(f.durationMin),rounds:n(f.rounds),positionalRounds:n(f.positionalRounds),
    submissions:n(f.submissions),taps:n(f.taps),rating:f.rating,focusPosition:f.focusPosition,
    notes:f.notes,techniqueIds:f.techniqueIds,
    partners:f.partners.split(',').map(x=>x.trim()).filter(Boolean),
    whatWorked:'',whatFailed:'',nextFocus:'',createdAt:now()
  })

  return <Modal title="Log session" close={close}>
    <div className="session-template-wrap">
      <small>QUICK TEMPLATES</small>
      <div className="session-template-row">{templates.map(t=><button key={t.name} onClick={()=>applyTemplate(t)}>{t.name}</button>)}</div>
    </div>
    <div className="form2">
      <Field label="Date"><input type="date" value={f.trainedAt} onChange={e=>setF({...f,trainedAt:e.target.value})}/></Field>
      <Field label="Type"><select value={f.mode} onChange={e=>setF({...f,mode:e.target.value as any})}><option>Gi</option><option>No-Gi</option></select></Field>
      <Field label="Session format"><select value={f.sessionType} onChange={e=>setF({...f,sessionType:e.target.value as Session['sessionType']})}><option>Class + Sparring</option><option>Open Mat</option><option>Positional</option><option>Drilling</option></select></Field>
      <Field label="Minutes"><input inputMode="numeric" value={f.durationMin} onChange={numberField('durationMin')} placeholder="0"/></Field>
      <Field label="Rounds"><input inputMode="numeric" value={f.rounds} onChange={numberField('rounds')} placeholder="0"/></Field>
      <Field label="Positional rounds"><input inputMode="numeric" value={f.positionalRounds} onChange={numberField('positionalRounds')} placeholder="0"/></Field>
      <Field label="Submissions"><input inputMode="numeric" value={f.submissions} onChange={numberField('submissions')} placeholder="0"/></Field>
      <Field label="Tapped"><input inputMode="numeric" value={f.taps} onChange={numberField('taps')} placeholder="0"/></Field>
    </div>
    <Field label="Training focus"><input value={f.focusPosition} onChange={e=>setF({...f,focusPosition:e.target.value})} placeholder="e.g. bottom half, passing, stand-up"/></Field>
    <Field label="Rating"><div className="rate">{[1,2,3,4,5].map(x=><button className={x<=f.rating?'on':''} onClick={()=>setF({...f,rating:x})} key={x}>★</button>)}</div></Field>
    <Field label="Techniques used"><div className="pick">{techniques.map(t=><button className={f.techniqueIds.includes(t.id)?'on':''} onClick={()=>toggle(t.id)} key={t.id}>{t.name}</button>)}</div></Field>
    <Field label="Partners"><input value={f.partners} onChange={e=>setF({...f,partners:e.target.value})} placeholder="Optional, comma separated"/></Field>
    <Field label="Notes"><textarea value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Anything else worth remembering?"/></Field>
    <button className="primary wide" onClick={submit}>Save session</button>
  </Modal>
}

function PostSessionReview({session,close,save}:{session:Session;close:()=>void;save:(s:Session)=>void}){
  const [worked,setWorked]=useState(session.whatWorked||'')
  const [failed,setFailed]=useState(session.whatFailed||'')
  const [nextFocus,setNextFocus]=useState(session.nextFocus||'')
  return <Modal title="30-second session review" close={close}>
    <div className="post-review-intro"><Sparkles size={18}/><p>Capture the useful signal while the session is fresh. These notes feed Analytics and AI reviews.</p></div>
    <Field label="What worked?"><textarea value={worked} onChange={e=>setWorked(e.target.value)} placeholder="e.g. knee shield frames kept me safe"/></Field>
    <Field label="What failed / got exposed?"><textarea value={failed} onChange={e=>setFailed(e.target.value)} placeholder="e.g. lost underhook when flattened"/></Field>
    <Field label="What should you focus on next?"><input value={nextFocus} onChange={e=>setNextFocus(e.target.value)} placeholder="e.g. underhook → dogfight"/></Field>
    <div className="actions"><button onClick={close}>Skip for now</button><button className="primary" onClick={()=>save({...session,whatWorked:worked.trim(),whatFailed:failed.trim(),nextFocus:nextFocus.trim()})}>Save review</button></div>
  </Modal>
}

function Techniques({data,update,authUser}:{data:AppData;update:any;authUser:string|null}){
  const [view,setView]=useState<'library'|'systems'|'discover'>('library')
  const [discoverMode,setDiscoverMode]=useState<'techniques'|'systems'>('techniques')
  const [open,setOpen]=useState(false),[importOpen,setImportOpen]=useState(false),[q,setQ]=useState(''),[cat,setCat]=useState('All')
  const [detail,setDetail]=useState<CatalogTechnique|null>(null),[systemDetail,setSystemDetail]=useState<CatalogSystem|null>(null)
  const [personalSystem,setPersonalSystem]=useState<Flow|null>(null)
  const [personalTechnique,setPersonalTechnique]=useState<Technique|null>(null)
  const [expandedCats,setExpandedCats]=useState<Record<string,boolean>>({})
  const [quickFilter,setQuickFilter]=useState<'all'|'needs-work'|'a-game'|'drill-queue'>('all')
  const [editingTechnique,setEditingTechnique]=useState<Technique|null>(null)
  const addingTechniqueNames=useRef(new Set<string>())
  const cats=['All','Takedown','Guard','Pass','Sweep','Escape','Submission','Control','Defense','Transition','Other']
  const list=data.techniques.filter(t=>(cat==='All'||t.category===cat)
    &&(quickFilter==='all'||(quickFilter==='needs-work'&&t.confidence<=2)||(quickFilter==='a-game'&&t.isFavorite)||(quickFilter==='drill-queue'&&t.inDrillQueue))
    &&(t.name+' '+t.position+' '+t.tags.join(' ')).toLowerCase().includes(q.toLowerCase()))
  const groupedCats=cats.filter(x=>x!=='All').map(name=>({name,items:list.filter(t=>t.category===name)})).filter(g=>g.items.length>0)
  const randomDrill=()=>{if(!list.length)return;setPersonalTechnique(list[Math.floor(Math.random()*list.length)])}
  const add=async(t:Technique)=>{
    const key=t.name.trim().toLowerCase()
    if(!key)return
    if(addingTechniqueNames.current.has(key)||data.techniques.some(x=>x.name.trim().toLowerCase()===key)){setOpen(false);return}
    addingTechniqueNames.current.add(key)
    setOpen(false)
    update((d:AppData)=>d.techniques.some(x=>x.name.trim().toLowerCase()===key)?d:{...d,techniques:[t,...d.techniques]})
    try{if(authUser)await cloudUpsert('technique',t)}finally{addingTechniqueNames.current.delete(key)}
  }
  const del=async(id:string)=>{update((d:AppData)=>({...d,techniques:d.techniques.filter(t=>t.id!==id)}));if(authUser)await cloudDelete('techniques',id)}
  const saveTechnique=async(t:Technique)=>{
    const next={...t,updatedAt:now()}
    update((d:AppData)=>({...d,techniques:d.techniques.map(x=>x.id===next.id?next:x)}))
    setEditingTechnique(null);setPersonalTechnique(next)
    if(authUser)await cloudUpsert('technique',next)
  }
  const patchTechnique=async(id:string,patch:Partial<Technique>)=>{
    const current=data.techniques.find(t=>t.id===id);if(!current)return
    const next={...current,...patch,updatedAt:now()}
    update((d:AppData)=>({...d,techniques:d.techniques.map(t=>t.id===id?next:t)}))
    setPersonalTechnique(next)
    if(authUser)await cloudUpsert('technique',next)
  }
  const addMany=async(items:Technique[])=>{update((d:AppData)=>({...d,techniques:[...items,...d.techniques]}));if(authUser)for(const t of items)await cloudUpsert('technique',t)}
  const addCatalog=async(item:CatalogTechnique)=>{
    if(data.techniques.some(t=>t.name.toLowerCase()===item.name.toLowerCase()))return
    const t=toPersonalTechnique(item);await add(t);setDetail(null)
  }
  const addSystem=async(item:CatalogSystem)=>{
    if(data.flows.some(f=>f.name.toLowerCase()===item.name.toLowerCase()))return
    const flow=cloneSystem(item)
    update((d:AppData)=>({...d,flows:[...d.flows,flow]}))
    if(authUser)await cloudUpsert('flow',flow)
    setSystemDetail(null)
  }
  const createOwnSystem=async()=>{
    const name=window.prompt('Name your system','My BJJ System')
    if(!name?.trim())return
    const description=window.prompt('What is this system for?','')||''
    const startId=uid()
    const flow:Flow={
      id:uid(),name:name.trim(),description:description.trim(),tags:[],references:[],
      nodes:[{id:startId,position:{x:80,y:100},data:{label:'Start position',kind:'position'}}],
      edges:[],createdAt:now(),updatedAt:now()
    }
    update((d:AppData)=>({...d,flows:[...d.flows,flow]}))
    if(authUser)await cloudUpsert('flow',flow)
    setPersonalSystem(flow)
  }
  const counts=catalogCounts()
  const discoverCategories=['Submission','Sweep','Guard','Pass','Control','Escape','Defense','Takedown','Transition']
  const discoverFiltered=catalogTechniques.filter(t=>(cat==='All'||t.category===cat)&&(t.name+' '+t.position+' '+t.tags.join(' ')).toLowerCase().includes(q.toLowerCase()))

  return <div className="stack">
    <Title eyebrow="PERSONAL KNOWLEDGE BASE" title="Library" text="Build your own technique library and game systems from scratch or from the curated Discover catalog.">
      <div className="actions">{view==='library'&&<button onClick={()=>setImportOpen(true)}>✨ Smart import</button>}</div>
    </Title>

    <div className="library-tabs">
      <button className={view==='library'?'active':''} onClick={()=>{setView('library');setCat('All');setQ('')}}>Techniques <span>{data.techniques.length}</span></button>
      <button className={view==='systems'?'active':''} onClick={()=>{setView('systems');setQ('')}}>Systems <span>{data.flows.length}</span></button>
      <button className={view==='discover'?'active':''} onClick={()=>{setView('discover');setCat('All');setQ('')}}>Discover</button>
    </div>

    {view==='library'&&<>
      <div className="filter wrap library-filterbar">
        <div className="search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search your techniques…"/></div>
        <select value={cat} onChange={e=>setCat(e.target.value)} aria-label="Technique category">
          {cats.map(x=><option key={x} value={x}>{x==='Pass'?'Guard Pass':x}</option>)}
        </select>
      </div>
      <div className="library-quick-actions">
        <button className={quickFilter==='all'?'selected':''} onClick={()=>setQuickFilter('all')}>All <span>{data.techniques.length}</span></button>
        <button className={quickFilter==='a-game'?'selected':''} onClick={()=>setQuickFilter('a-game')}><Star size={14}/>A-game <span>{data.techniques.filter(t=>t.isFavorite).length}</span></button>
        <button className={quickFilter==='drill-queue'?'selected':''} onClick={()=>setQuickFilter('drill-queue')}><Target size={14}/>Drill queue <span>{data.techniques.filter(t=>t.inDrillQueue).length}</span></button>
        <button className={quickFilter==='needs-work'?'selected':''} onClick={()=>setQuickFilter('needs-work')}>Needs work <span>{data.techniques.filter(t=>t.confidence<=2).length}</span></button>
        <button onClick={randomDrill} disabled={!list.length}><Shuffle size={15}/>Random drill</button>
      </div>
      <div className="technique-accordions">
        {groupedCats.length?groupedCats.map(group=>{
          const openGroup=Boolean(expandedCats[group.name])
          return <section className="technique-accordion" key={group.name}>
            <button className="technique-accordion-head" onClick={()=>setExpandedCats(v=>({...v,[group.name]:!openGroup}))}>
              <span className={'catalog-dot '+group.name.toLowerCase().replace(/\s/g,'-')}/>
              <span><b>{group.name==='Pass'?'Guard Pass':group.name}</b><small>{group.items.length} technique{group.items.length===1?'':'s'}</small></span>
              <ChevronDown size={20} className={openGroup?'rotated':''}/>
            </button>
            {openGroup&&<div className="personal-technique-list">{group.items.map(t=><button className="personal-technique-row" key={t.id} onClick={()=>setPersonalTechnique(t)}>
              <span className={'catalog-dot '+t.category.toLowerCase().replace(/\s/g,'-')}/>
              <span className="personal-technique-main"><b>{t.name}</b><small>{t.position||'No position'} · {t.giMode}</small><span className="personal-technique-tags">{t.tags.slice(0,3).map(x=><em key={x}>{x}</em>)}</span></span>
              <span className="personal-technique-meta">{t.isFavorite&&<Star size={13} className="a-game-star"/>}{t.inDrillQueue&&<Target size={13} className="drill-target"/>}<small>{t.confidence}/5</small><span>›</span></span>
            </button>)}</div>}
          </section>
        }):<Empty>No techniques match this filter.</Empty>}
      </div>
      <button className="library-fab" onClick={()=>setOpen(true)} aria-label="Add technique"><CirclePlus size={24}/></button>
    </>}

    {view==='systems'&&<>
      <div className="filter"><div className="search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search your systems…"/></div><span className="pill">{data.flows.length} systems</span></div>

      <section className="library-system-section">
        <div className="library-section-head"><div><small>MY SYSTEMS</small><h3>Your gameplans</h3></div></div>
        <div className="system-grid">{data.flows.filter(f=>(f.name+' '+f.description).toLowerCase().includes(q.toLowerCase())).map(f=><button className="system-card library-system-card" key={f.id} onClick={()=>setPersonalSystem(f)}><span className="catalog-accent system"/><div><div className="between"><span className="tag blue">System</span><ChevronRight size={18}/></div><h3>{f.name}</h3><p>{f.description||'Personal gameplan system.'}</p><div className="chips">{flowTags(f).slice(0,3).map(x=><span className="tag" key={x}>{x}</span>)}</div><small>{f.nodes.length} steps · {f.edges.length} connections</small></div></button>)}</div>
        {!data.flows.length&&<Empty>No systems yet. Create your own or add one of the suggestions below.</Empty>}
      </section>

      {!q&&<section className="library-system-section suggested-systems">
        <div className="library-section-head"><div><small>SUGGESTED SYSTEMS</small><h3>Ready-made starting points</h3><p>Add one, then make it yours in Gameplan.</p></div></div>
        <div className="system-grid">{catalogSystems.slice(0,6).map(s=>{
          const added=data.flows.some(f=>f.name.toLowerCase()===s.name.toLowerCase())
          return <article className="system-card suggested-system-card" key={s.slug}>
            <span className="catalog-accent system"/>
            <div className="suggested-system-body">
              <div className="between"><span className="tag blue">Starter system</span><button className={added?'system-add-button added':'system-add-button'} disabled={added} onClick={async()=>{if(!added)await addSystem(s)}} aria-label={added?'Already added':'Add '+s.name}>{added?'✓':'+'}</button></div>
              <button className="suggested-system-open" onClick={()=>setSystemDetail(s)}>
                <h3>{s.name}</h3><p>{s.description}</p>
                <div className="chips"><span className="tag">{s.giMode}</span><span className="tag">{s.level}</span>{s.tags.slice(0,2).map(x=><span className="tag" key={x}>#{x}</span>)}</div>
              </button>
            </div>
          </article>
        })}</div>
      </section>}
      <button className="library-fab system-fab" onClick={createOwnSystem} aria-label="Create system"><CirclePlus size={24}/></button>
    </>}

    {view==='discover'&&<>
      <div className="discover-switch"><button className={discoverMode==='techniques'?'active':''} onClick={()=>{setDiscoverMode('techniques');setCat('All')}}>Techniques</button><button className={discoverMode==='systems'?'active':''} onClick={()=>setDiscoverMode('systems')}>Systems</button></div>
      {discoverMode==='techniques'?<>
        <div className="filter"><div className="search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search Discover…"/></div>{cat!=='All'&&<button onClick={()=>setCat('All')}>All categories</button>}</div>
        {cat==='All'?
          <div className="discover-categories">{discoverCategories.map((name,i)=><button className="discover-category" key={name} onClick={()=>setCat(name)}><span className={'catalog-accent c'+i}/><div><b>{name==='Pass'?'Guard Pass':name}</b><small>{counts[name]||0} techniques</small></div><ChevronRight size={22}/></button>)}</div>
          :
          <div className="discover-list">{discoverFiltered.map(t=>{
            const added=data.techniques.some(x=>x.name.trim().toLowerCase()===t.name.trim().toLowerCase())
            return <article className="discover-tech-row" key={t.slug}>
              <span className={'catalog-dot '+t.category.toLowerCase().replace(/\s/g,'-')}/>
              <button className="discover-tech-info" onClick={()=>setDetail(t)} aria-label={'View '+t.name+' details'}>
                <b>{t.name}</b><small>{t.position} · {t.giMode} · {t.level}</small>
              </button>
              <button
                className={added?'discover-add-action added':'discover-add-action'}
                disabled={added}
                onClick={()=>addCatalog(t)}
                aria-label={added?t.name+' already added':'Add '+t.name+' to library'}
              >{added?'✓':'+'}</button>
            </article>
          })}</div>
        }
      </>:<div className="system-grid discover-systems">{catalogSystems.map(s=>{const added=data.flows.some(f=>f.name.toLowerCase()===s.name.toLowerCase());return <button className="system-card discover-system" key={s.slug} onClick={()=>setSystemDetail(s)}><span className="catalog-accent system"/><div><div className="between"><span className="tag blue">Starter system</span><span className={added?'discover-added':'discover-plus'}>{added?'✓':'+'}</span></div><h3>{s.name}</h3><p>{s.description}</p><div className="chips"><span className="tag">{s.giMode}</span><span className="tag">{s.level}</span>{s.tags.slice(0,2).map(x=><span className="tag" key={x}>#{x}</span>)}</div></div></button>})}</div>}
    </>}

    {open&&<TechniqueForm close={()=>setOpen(false)} save={add}/>}
    {importOpen&&<TechniqueImporter authUser={authUser} close={()=>setImportOpen(false)} saveMany={addMany}/>}
    {detail&&<CatalogTechniqueDetail item={detail} added={data.techniques.some(t=>t.name.toLowerCase()===detail.name.toLowerCase())} close={()=>setDetail(null)} add={()=>addCatalog(detail)}/>}
    {systemDetail&&<CatalogSystemDetail item={systemDetail} added={data.flows.some(f=>f.name.toLowerCase()===systemDetail.name.toLowerCase())} close={()=>setSystemDetail(null)} add={()=>addSystem(systemDetail)}/>}
    {personalSystem&&<PersonalLibrarySystemDetail flow={data.flows.find(f=>f.id===personalSystem.id)||personalSystem} techniques={data.techniques} close={()=>setPersonalSystem(null)}/>}
    {personalTechnique&&<PersonalTechniqueDetail
      technique={data.techniques.find(t=>t.id===personalTechnique.id)||personalTechnique}
      close={()=>setPersonalTechnique(null)}
      remove={async()=>{await del(personalTechnique.id);setPersonalTechnique(null)}}
      edit={()=>setEditingTechnique(data.techniques.find(t=>t.id===personalTechnique.id)||personalTechnique)}
      toggleFavorite={()=>patchTechnique(personalTechnique.id,{isFavorite:!personalTechnique.isFavorite})}
      toggleDrillQueue={()=>patchTechnique(personalTechnique.id,{inDrillQueue:!personalTechnique.inDrillQueue})}
      drilled={()=>patchTechnique(personalTechnique.id,{drillingCount:(personalTechnique.drillingCount||0)+1})}
    />}
    {editingTechnique&&<TechniqueForm initial={editingTechnique} close={()=>setEditingTechnique(null)} save={saveTechnique}/>}
  </div>
}

function confidenceLabel(n:number){
  return ['','New / learning','Can drill it','Sometimes works live','Reliable in sparring','A-game / automatic'][Math.max(1,Math.min(5,n))]
}

function PersonalTechniqueDetail({technique,close,remove,edit,toggleFavorite,toggleDrillQueue,drilled}:{technique:Technique;close:()=>void;remove:()=>void;edit:()=>void;toggleFavorite:()=>void;toggleDrillQueue:()=>void;drilled:()=>void}){
  return <Modal title={technique.name} close={close}><div className="personal-technique-detail">
    <div className="technique-detail-actions">
      <button className={technique.isFavorite?'selected':''} onClick={toggleFavorite}><Star size={16}/>{technique.isFavorite?'In A-game':'Add to A-game'}</button>
      <button className={technique.inDrillQueue?'selected':''} onClick={toggleDrillQueue}><Target size={16}/>{technique.inDrillQueue?'In drill queue':'Add to drill queue'}</button>
      <button onClick={drilled}><Activity size={16}/>Drilled +1</button>
    </div>
    <div className="between"><div className="chips"><span className="tag selected">{technique.category==='Pass'?'Guard Pass':technique.category}</span><span className="tag">{technique.giMode}</span></div><div className="actions"><button className="icon" onClick={edit} aria-label="Edit technique"><Pencil size={17}/></button><button className="icon danger" onClick={remove} aria-label="Remove technique"><Trash2 size={17}/></button></div></div>
    <div className="technique-detail-stats"><span><small>Confidence</small><b>{technique.confidence}/5</b><em>{confidenceLabel(technique.confidence)}</em></span><span><small>Drilled</small><b>{technique.drillingCount}×</b></span><span><small>Position</small><b>{technique.position||'Not set'}</b></span></div>
    <section><h3>Description & notes</h3><p className={technique.notes?'':'muted'}>{technique.notes||'No notes added yet.'}</p></section>
    {technique.tags.length>0&&<section><h3>Tags</h3><div className="chips">{technique.tags.map(x=><span className="tag" key={x}>#{x}</span>)}</div></section>}
    {technique.videoUrl&&<section><h3>Tutorial</h3><a className="technique-video-link" href={technique.videoUrl} target="_blank" rel="noreferrer"><BookOpen size={18}/><span><b>Open YouTube tutorial</b><small>Technique reference</small></span><ExternalLink size={16}/></a></section>}
  </div></Modal>
}

function PersonalLibrarySystemDetail({flow,techniques,close}:{flow:Flow;techniques:Technique[];close:()=>void}){
  const tags=flowTags(flow,techniques)
  const refs=flowReferences(flow,techniques)
  const created=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric'}).format(new Date(flow.createdAt))
  return <Modal title={flow.name} close={close}><div className="catalog-detail personal-system-detail">
    <div className="between"><div className="chips"><span className="tag blue">System</span>{tags.slice(0,3).map(x=><span className="tag" key={x}>{x}</span>)}</div><span className="muted tiny">{created}</span></div>
    <p>{flow.description||'Your personal BJJ decision tree.'}</p>
    <div className="catalog-flow-preview personal-flow-preview"><ReactFlow nodes={flow.nodes as any} edges={flow.edges as any} fitView nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}><Controls/><Background gap={20}/></ReactFlow></div>
    <div className="detail-section"><h3>Notes</h3><p className={flow.description?'':'muted'}>{flow.description||'No notes added yet.'}</p></div>
    <div className="detail-section"><h3>Links & references</h3>{refs.length?<div className="reference-grid">{refs.map(r=><a key={r.url} href={r.url} target="_blank" rel="noreferrer"><BookOpen size={17}/><span><b>{r.technique}</b><small>{r.label}</small></span><ExternalLink size={15}/></a>)}</div>:<p className="muted">Add recognizable technique names to this system and matching YouTube references will appear automatically.</p>}</div>
    <p className="system-edit-hint">Open the Gameplan tab when you want to edit nodes, reactions and connections.</p>
  </div></Modal>
}

function CatalogTechniqueDetail({item,added,close,add}:{item:CatalogTechnique;added:boolean;close:()=>void;add:()=>void}){
  return <Modal title={item.name} close={close}><div className="catalog-detail">
    <div className="chips"><span className="tag selected">{item.category==='Pass'?'Guard Pass':item.category}</span><span className="tag">{item.giMode}</span><span className="tag">{item.level}</span></div>
    <h3>Description</h3><p>{item.description}</p>
    <h3>Key points</h3><div className="detail-points">{item.keyPoints.map((x,i)=><div key={x}><span>{i+1}</span><p>{x}</p></div>)}</div>
    <h3>References</h3><div className="reference-grid">{item.references.map(r=><a key={r.url} href={r.url} target="_blank" rel="noreferrer"><BookOpen size={17}/><span><b>{r.label}</b><small>YouTube only · direct video where curated</small></span><ChevronRight size={16}/></a>)}</div>
    <div className="chips">{item.tags.map(x=><span className="tag" key={x}>#{x}</span>)}</div>
    <button className="primary wide" disabled={added} onClick={add}>{added?'Already in My Library':'Add to My Library'}</button>
  </div></Modal>
}

function CatalogSystemDetail({item,added,close,add}:{item:CatalogSystem;added:boolean;close:()=>void;add:()=>void}){
  return <Modal title={item.name} close={close}><div className="catalog-detail">
    <div className="chips"><span className="tag blue">System</span><span className="tag">{item.giMode}</span><span className="tag">{item.level}</span></div>
    <p>{item.description}</p>
    <div className="catalog-flow-preview"><ReactFlow nodes={item.flow.nodes as any} edges={item.flow.edges as any} fitView nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} panOnDrag={false} zoomOnScroll={false} zoomOnPinch={false}><Background gap={20}/></ReactFlow></div>
    <div className="chips">{item.tags.map(x=><span className="tag" key={x}>#{x}</span>)}</div>
    <button className="primary wide" disabled={added} onClick={add}>{added?'Already in My Systems':'Add editable copy to My Systems'}</button>
  </div></Modal>
}

function TechniqueForm({close,save,initial}:{close:()=>void;save:(t:Technique)=>void;initial?:Technique}){
  const [f,setF]=useState({
    name:initial?.name||'',category:initial?.category||'Takedown',position:initial?.position||'',giMode:initial?.giMode||'Both',
    notes:initial?.notes||'',videoUrl:initial?.videoUrl||'',tags:(initial?.tags||[]).join(', '),confidence:initial?.confidence||2
  })
  const commit=()=>save({
    id:initial?.id||uid(),name:f.name.trim(),category:f.category as any,position:f.position,giMode:f.giMode as any,
    notes:f.notes,videoUrl:f.videoUrl,tags:f.tags.split(',').map(x=>x.trim()).filter(Boolean),confidence:f.confidence,
    drillingCount:initial?.drillingCount||0,isFavorite:initial?.isFavorite||false,inDrillQueue:initial?.inDrillQueue||false,
    createdAt:initial?.createdAt||now(),updatedAt:now()
  })
  return <Modal title={initial?'Edit technique':'Add technique'} close={close}>
    <div className="form2">
      <Field label="Name"><input value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Field>
      <Field label="Category"><select value={f.category} onChange={e=>setF({...f,category:e.target.value as any})}>{['Takedown','Guard','Pass','Sweep','Escape','Submission','Control','Defense','Transition','Other'].map(x=><option key={x}>{x}</option>)}</select></Field>
      <Field label="Position"><input value={f.position} onChange={e=>setF({...f,position:e.target.value})}/></Field>
      <Field label="Mode"><select value={f.giMode} onChange={e=>setF({...f,giMode:e.target.value as any})}><option>Both</option><option>Gi</option><option>No-Gi</option></select></Field>
    </div>
    <Field label={'Confidence '+f.confidence+'/5 · '+confidenceLabel(f.confidence)}><input type="range" min="1" max="5" value={f.confidence} onChange={e=>setF({...f,confidence:+e.target.value})}/></Field>
    <p className="confidence-help">1 = new · 2 = drillable · 3 = sometimes works live · 4 = reliable · 5 = A-game / automatic</p>
    <Field label="Tutorial link"><input value={f.videoUrl} onChange={e=>setF({...f,videoUrl:e.target.value})} placeholder="YouTube / instructional"/></Field>
    <Field label="Tags"><input value={f.tags} onChange={e=>setF({...f,tags:e.target.value})} placeholder="pressure, A-game, competition"/></Field>
    <Field label="Notes"><textarea value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/></Field>
    <button className="primary wide" disabled={!f.name.trim()} onClick={commit}>{initial?'Save changes':'Add technique'}</button>
  </Modal>
}

type FlowTechniqueMatch={
  nodeId:string
  label:string
  personal?:Technique
  catalog?:CatalogTechnique
  name:string
  category:Technique['category']
  position:string
  tags:string[]
  giMode:string
}

const normTechnique=(value:string)=>value
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase()
  .replace(/halfguard/g,'half guard')
  .replace(/backtake/g,'back take')
  .replace(/[^a-z0-9]+/g,' ')
  .trim()

const techniqueAlias:Record<string,string>={
  'sasae':'sasae tsurikomi ashi',
  'ouchi':'ouchi gari',
  'o uchi':'ouchi gari',
  'kouchi':'kouchi gari',
  'ko uchi':'kouchi gari',
  'rnc':'rear naked choke',
  'backtake':'back take'
}

const techniqueScore=(label:string,name:string)=>{
  let a=normTechnique(label),b=normTechnique(name)
  a=techniqueAlias[a]||a;b=techniqueAlias[b]||b
  if(!a||!b)return 0
  if(a===b)return 100
  if((a.includes(b)||b.includes(a))&&Math.min(a.length,b.length)>=5)return 82
  const stop=new Set(['the','from','to','guard','pass','choke','sweep','control','position','take'])
  const at=a.split(' ').filter(x=>x.length>2&&!stop.has(x))
  const bt=b.split(' ').filter(x=>x.length>2&&!stop.has(x))
  if(!at.length||!bt.length)return 0
  const overlap=at.filter(x=>bt.includes(x)).length
  const ratio=overlap/Math.max(1,Math.min(at.length,bt.length))
  return overlap>=1&&ratio>=.6?60+Math.round(ratio*15):0
}

function matchFlowNode(node:Flow['nodes'][number],personal:Technique[]):FlowTechniqueMatch|null{
  const label=String(node.data.label||'').trim()
  if(!label)return null

  if(node.data.techniqueId){
    const linked=personal.find(t=>t.id===node.data.techniqueId)
    if(linked){
      const cat=catalogTechniques
        .map(t=>({t,score:techniqueScore(linked.name,t.name)}))
        .sort((a,b)=>b.score-a.score)[0]
      return {nodeId:node.id,label,personal:linked,catalog:cat?.score>=60?cat.t:undefined,name:linked.name,category:linked.category,position:linked.position,tags:linked.tags,giMode:linked.giMode}
    }
  }

  const p=personal
    .map(t=>({t,score:techniqueScore(label,t.name)+5}))
    .sort((a,b)=>b.score-a.score)[0]
  const cat=catalogTechniques
    .map(t=>({t,score:techniqueScore(label,t.name)}))
    .sort((a,b)=>b.score-a.score)[0]
  if((p?.score||0)<60&&(cat?.score||0)<60)return null
  if((p?.score||0)>=(cat?.score||0)){
    const t=p.t
    return {nodeId:node.id,label,personal:t,catalog:cat?.score>=60?cat.t:undefined,name:t.name,category:t.category,position:t.position,tags:t.tags,giMode:t.giMode}
  }
  const t=cat.t
  return {nodeId:node.id,label,catalog:t,name:t.name,category:t.category as Technique['category'],position:t.position,tags:t.tags,giMode:t.giMode}
}

function flowTechniqueMatches(flow:Flow,personal:Technique[]){
  return flow.nodes.map(n=>matchFlowNode(n,personal)).filter(Boolean) as FlowTechniqueMatch[]
}

function flowTags(flow:Flow,personal:Technique[]=[]){
  const matches=flowTechniqueMatches(flow,personal)
  const auto:string[]=[]
  for(const m of matches){
    auto.push(m.category==='Pass'?'Guard Pass':m.category)
    auto.push(...m.tags.map(t=>t.replace(/-/g,' ')))
    if(m.position)auto.push(...m.position.split('/').map(x=>x.trim()).filter(Boolean))
  }
  const hay=(flow.name+' '+flow.description+' '+flow.nodes.map(n=>n.data.label).join(' ')).toLowerCase()
  const fallback=[
    ['passing','Passing'],['half guard','Half Guard'],['closed guard','Closed Guard'],['open guard','Open Guard'],
    ['mount','Mount'],['back','Back Control'],['pressure','Pressure'],['wrestle','Wrestle-up']
  ] as const
  fallback.filter(([needle])=>hay.includes(needle)).forEach(([,label])=>auto.push(label))
  const merged=[...(flow.tags||[]),...auto]
    .map(x=>x.trim()).filter(Boolean)
    .filter((x,i,a)=>a.findIndex(y=>y.toLowerCase()===x.toLowerCase())===i)
  return merged.length?merged.slice(0,10):['Personal system']
}

function flowReferences(flow:Flow,personal:Technique[]=[]){
  const manual=(flow.references||[])
    .filter(r=>r.label?.trim()&&r.url?.trim())
    .map(r=>({label:r.label,url:r.url,technique:'Custom reference'}))
  const seen=new Set(manual.map(r=>r.url))
  const refs:{label:string;url:string;technique:string}[]=[...manual]
  const matches=flowTechniqueMatches(flow,personal)

  for(const m of matches){
    if(m.personal?.videoUrl&&!seen.has(m.personal.videoUrl)){
      seen.add(m.personal.videoUrl)
      refs.push({label:m.personal.name+' tutorial',url:m.personal.videoUrl,technique:m.personal.name})
      continue
    }
    const source=m.catalog
    if(source){
      const best=source.references.find(r=>/youtube\.com\/watch|youtu\.be\//.test(r.url))||source.references[0]
      if(best&&!seen.has(best.url)){
        seen.add(best.url)
        refs.push({label:best.label,url:best.url,technique:source.name})
      }
    }
  }
  return refs.slice(0,10)
}

function Flows({data,update,authUser}:{data:AppData;update:any;authUser:string|null}){
  const [selectedId,setSelectedId]=useState<string|null>(null)
  const [editing,setEditing]=useState(false)
  const [trainer,setTrainer]=useState(false)
  const [metaOpen,setMetaOpen]=useState(false)
  const [q,setQ]=useState('')
  const [selectedNodeId,setSelectedNodeId]=useState<string|null>(null)
  const [selectedEdgeId,setSelectedEdgeId]=useState<string|null>(null)
  const [linkFromId,setLinkFromId]=useState<string|null>(null)
  const [linkPickerNodeId,setLinkPickerNodeId]=useState<string|null>(null)
  const [nodeInfo,setNodeInfo]=useState<FlowTechniqueMatch|null>(null)
  const [saveState,setSaveState]=useState<'idle'|'saving'|'saved'|'error'>('idle')
  const undoRef=useRef<{nodes:Flow['nodes'];edges:Flow['edges']}[]>([])
  const redoRef=useRef<{nodes:Flow['nodes'];edges:Flow['edges']}[]>([])
  const saveTimer=useRef<number|undefined>(undefined)
  const savedTimer=useRef<number|undefined>(undefined)
  const flow=selectedId?data.flows.find(f=>f.id===selectedId)||null:null

  const resetSelection=()=>{setSelectedNodeId(null);setSelectedEdgeId(null);setLinkFromId(null)}
  const stateOf=(f:Flow)=>({nodes:structuredClone(f.nodes),edges:structuredClone(f.edges)})
  const pushHistory=()=>{
    if(!flow)return
    undoRef.current=[...undoRef.current.slice(-39),stateOf(flow)]
    redoRef.current=[]
  }
  const queueCloudSave=(next:Flow)=>{
    if(!authUser){
      setSaveState('saved')
      window.clearTimeout(savedTimer.current)
      savedTimer.current=window.setTimeout(()=>setSaveState('idle'),1000)
      return
    }
    setSaveState('saving')
    window.clearTimeout(saveTimer.current)
    saveTimer.current=window.setTimeout(async()=>{
      try{
        await cloudUpsert('flow',next)
        setSaveState('saved')
        window.clearTimeout(savedTimer.current)
        savedTimer.current=window.setTimeout(()=>setSaveState('idle'),1300)
      }catch(e){
        console.error(e)
        setSaveState('error')
      }
    },450)
  }
  const persist=(next:Flow)=>{
    update((d:AppData)=>({...d,flows:d.flows.map(f=>f.id===next.id?next:f)}))
    queueCloudSave(next)
  }
  const undo=()=>{
    if(!flow||!undoRef.current.length)return
    const previous=undoRef.current[undoRef.current.length-1]
    undoRef.current=undoRef.current.slice(0,-1)
    redoRef.current.push(stateOf(flow))
    persist({...flow,nodes:previous.nodes,edges:previous.edges,updatedAt:now()})
    resetSelection()
  }
  const redo=()=>{
    if(!flow||!redoRef.current.length)return
    const nextState=redoRef.current[redoRef.current.length-1]
    redoRef.current=redoRef.current.slice(0,-1)
    undoRef.current.push(stateOf(flow))
    persist({...flow,nodes:nextState.nodes,edges:nextState.edges,updatedAt:now()})
    resetSelection()
  }
  const deleteNode=()=>{
    if(!flow||!selectedNodeId)return
    pushHistory()
    persist({...flow,nodes:flow.nodes.filter(n=>n.id!==selectedNodeId),edges:flow.edges.filter(e=>e.source!==selectedNodeId&&e.target!==selectedNodeId),updatedAt:now()})
    setSelectedNodeId(null);setLinkFromId(null)
  }
  const deleteEdge=()=>{
    if(!flow||!selectedEdgeId)return
    pushHistory()
    persist({...flow,edges:flow.edges.filter(e=>e.id!==selectedEdgeId),updatedAt:now()})
    setSelectedEdgeId(null)
  }

  useEffect(()=>{
    undoRef.current=[];redoRef.current=[];resetSelection()
  },[selectedId])

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if(!editing||!flow)return
      const tag=(e.target as HTMLElement | null)?.tagName?.toLowerCase()
      const typing=tag==='input'||tag==='textarea'||tag==='select'
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){
        e.preventDefault()
        if(e.shiftKey)redo();else undo()
      }else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){
        e.preventDefault();redo()
      }else if(!typing&&(e.key==='Delete'||e.key==='Backspace')){
        if(selectedNodeId){e.preventDefault();deleteNode()}
        else if(selectedEdgeId){e.preventDefault();deleteEdge()}
      }
    }
    window.addEventListener('keydown',onKey)
    return()=>window.removeEventListener('keydown',onKey)
  },[editing,selectedId,selectedNodeId,selectedEdgeId,data.flows])

  const addFlow=()=>{
    const f:Flow={id:uid(),name:'New gameplan',description:'',tags:[],references:[],nodes:[],edges:[],createdAt:now(),updatedAt:now()}
    update((d:AppData)=>({...d,flows:[...d.flows,f]}))
    setSelectedId(f.id);setEditing(true);resetSelection()
    queueCloudSave(f)
  }

  if(!flow){
    const list=data.flows.filter(f=>(f.name+' '+f.description).toLowerCase().includes(q.toLowerCase()))
    return <div className="stack">
      <Title eyebrow="YOUR BJJ SYSTEMS" title="Gameplan" text="Open a system to study the decision tree. Tags and video references update automatically from techniques found in the graph.">
        <button className="primary" onClick={addFlow}><CirclePlus size={16}/>New system</button>
      </Title>
      <div className="filter"><div className="search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search gameplans…"/></div><span className="pill">{data.flows.length} systems</span></div>
      <div className="gameplan-grid">
        {list.map(f=>{
          const matches=flowTechniqueMatches(f,data.techniques)
          return <button className="gameplan-card" key={f.id} onClick={()=>{setSelectedId(f.id);setEditing(false);resetSelection()}}>
            <span className="gameplan-card-accent"/>
            <div className="gameplan-card-body">
              <div className="between"><span className="tag blue">System</span><ChevronRight size={18}/></div>
              <h3>{f.name}</h3>
              <p>{f.description||'A personal BJJ decision tree.'}</p>
              <div className="chips">{flowTags(f,data.techniques).slice(0,3).map(x=><span className="tag" key={x}>{x}</span>)}</div>
              <small>{f.nodes.length} steps · {f.edges.length} connections · {matches.length} techniques detected</small>
            </div>
          </button>
        })}
      </div>
      {!list.length&&<Empty>No gameplans match your search.</Empty>}
    </div>
  }

  const matches=flowTechniqueMatches(flow,data.techniques)
  const tags=flowTags(flow,data.techniques)
  const refs=flowReferences(flow,data.techniques)
  const nodes=(changes:NodeChange[])=>persist({...flow,nodes:applyNodeChanges(changes,flow.nodes as any) as any,updatedAt:now()})
  const edges=(changes:EdgeChange[])=>persist({...flow,edges:applyEdgeChanges(changes,flow.edges as any) as any,updatedAt:now()})
  const connect=(connection:Connection)=>{
    pushHistory()
    persist({...flow,edges:addEdge({...connection,id:uid(),markerEnd:{type:MarkerType.ArrowClosed}},flow.edges as any) as any,updatedAt:now()})
  }
  const addNode=()=>{
    const label=window.prompt('Node name','New step')
    if(!label?.trim())return
    pushHistory()
    persist({...flow,nodes:[...flow.nodes,{id:uid(),position:{x:120+Math.random()*360,y:100+Math.random()*260},data:{label:label.trim(),kind:'technique'}}],updatedAt:now()})
  }
  const renameSelected=()=>{
    if(selectedNodeId){
      const node=flow.nodes.find(n=>n.id===selectedNodeId);if(!node)return
      const label=window.prompt('Rename node',String(node.data.label||''));if(!label?.trim())return
      pushHistory()
      persist({...flow,nodes:flow.nodes.map(n=>n.id===selectedNodeId?{...n,data:{...n.data,label:label.trim()}}:n),updatedAt:now()})
    }else if(selectedEdgeId){
      const edge=flow.edges.find(e=>e.id===selectedEdgeId);if(!edge)return
      const label=window.prompt('Connection label',String(edge.label||''));if(label===null)return
      pushHistory()
      persist({...flow,edges:flow.edges.map(e=>e.id===selectedEdgeId?{...e,label:label.trim()}:e),updatedAt:now()})
    }
  }
  const connectTappedNodes=(source:string,target:string)=>{
    if(source===target)return
    if(flow.edges.some(e=>e.source===source&&e.target===target)){setLinkFromId(null);return}
    const label=window.prompt('Optional connection label','') ?? ''
    pushHistory()
    persist({...flow,edges:[...flow.edges,{id:uid(),source,target,label:label.trim()||undefined}],updatedAt:now()})
    setLinkFromId(null);setSelectedNodeId(target);setSelectedEdgeId(null)
  }
  const setTechniqueLink=(nodeId:string,techniqueId?:string)=>{
    pushHistory()
    persist({...flow,nodes:flow.nodes.map(n=>n.id===nodeId?{...n,data:{...n.data,techniqueId}}:n),updatedAt:now()})
    setLinkPickerNodeId(null)
  }
  const nodeTap=(_:unknown,node:any)=>{
    if(!editing){
      const match=matchFlowNode(node,data.techniques)
      if(match)setNodeInfo(match)
      return
    }
    if(linkFromId&&linkFromId!==node.id){connectTappedNodes(linkFromId,node.id);return}
    setSelectedNodeId(node.id);setSelectedEdgeId(null)
  }
  const edgeTap=(_:unknown,edge:any)=>{
    if(!editing)return
    setSelectedEdgeId(edge.id);setSelectedNodeId(null);setLinkFromId(null)
  }
  const editDetails=()=>setMetaOpen(true)
  const created=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric'}).format(new Date(flow.createdAt))
  const selectedNode=selectedNodeId?flow.nodes.find(n=>n.id===selectedNodeId):null
  const selectedEdge=selectedEdgeId?flow.edges.find(e=>e.id===selectedEdgeId):null
  const selectedMatch=selectedNode?matchFlowNode(selectedNode,data.techniques):null
  const renderNodes=flow.nodes.map(n=>{
    const m=matchFlowNode(n,data.techniques)
    return {...n,selected:editing&&n.id===selectedNodeId,className:m?'technique-linked-node':''}
  })
  const renderEdges=flow.edges.map(e=>({...e,selected:editing&&e.id===selectedEdgeId,markerEnd:{type:MarkerType.ArrowClosed}}))

  return <div className="stack gameplan-detail">
    <div className="gameplan-detail-nav">
      <button onClick={()=>{setSelectedId(null);setEditing(false);resetSelection()}}><ArrowLeft size={17}/>All gameplans</button>
      <div className="actions">
        {saveState==='saving'&&<span className="save-state saving">Saving…</span>}
        {saveState==='saved'&&<span className="save-state saved"><CheckCircle2 size={14}/>Saved</span>}
        {saveState==='error'&&<span className="save-state error"><AlertCircle size={14}/>Save failed</span>}
        <button onClick={()=>setTrainer(true)}><Target size={16}/>Decision trainer</button>
      </div>
    </div>

    <section className="gameplan-hero">
      <span className="gameplan-hero-accent"/>
      <div className="gameplan-hero-copy">
        <div className="between"><span className="tag blue">System</span><button onClick={editDetails}><Pencil size={15}/>Edit details</button></div>
        <h2>{flow.name}</h2>
        <p>{flow.description||'Build this system around positions, reactions and techniques you want to recognize automatically.'}</p>
        <div className="gameplan-meta">
          <span><small>Created</small><b>{created}</b></span>
          <span><small>Graph</small><b>{flow.nodes.length} steps · {flow.edges.length} links</b></span>
          <span><small>Detected</small><b>{matches.length} techniques</b></span>
        </div>
      </div>
    </section>

    <section className="card gameplan-graph-card">
      <div className="head">
        <div><small>GRAPH</small><h3>{editing?'Builder mode':'System map'}</h3></div>
        <div className="actions">
          {editing&&<><button disabled={!undoRef.current.length} onClick={undo} title="Undo (Ctrl/Cmd+Z)"><Undo2 size={15}/>Undo</button><button disabled={!redoRef.current.length} onClick={redo} title="Redo"><Redo2 size={15}/>Redo</button><button onClick={addNode}><CirclePlus size={15}/>Add node</button></>}
          <button className={editing?'primary':''} onClick={()=>{setEditing(v=>!v);resetSelection()}}><Pencil size={15}/>{editing?'Done editing':'Edit nodes'}</button>
        </div>
      </div>

      {editing&&<div className="flow-editor-toolbar">
        {linkFromId?<><span className="flow-editor-status"><Link2 size={15}/>Tap the node you want to connect to</span><button onClick={()=>setLinkFromId(null)}>Cancel</button></>
        :selectedNode?<><span className="flow-editor-status"><b>Node:</b> {String(selectedNode.data.label||'Untitled')}{selectedMatch&&<em>Matched: {selectedMatch.name}</em>}</span><button onClick={renameSelected}><Pencil size={15}/>Rename</button><button onClick={()=>setLinkPickerNodeId(selectedNode.id)}><BookOpen size={15}/>Link technique</button><button onClick={()=>setLinkFromId(selectedNode.id)}><Link2 size={15}/>Link from</button><button className="danger" onClick={deleteNode}><Trash2 size={15}/>Delete node</button></>
        :selectedEdge?<><span className="flow-editor-status"><b>Connection:</b> {selectedEdge.label||'Unlabelled'}</span><button onClick={renameSelected}><Pencil size={15}/>Rename link</button><button className="danger" onClick={deleteEdge}><Trash2 size={15}/>Delete link</button></>
        :<span className="flow-editor-status">Tap a node or connection to edit it. Blue-outlined nodes are recognized techniques.</span>}
      </div>}

      <div className={editing?'canvas gameplan-canvas':'canvas gameplan-canvas read-only'}>
        <ReactFlow
          nodes={renderNodes as any}
          edges={renderEdges as any}
          onNodesChange={editing?nodes:undefined}
          onEdgesChange={editing?edges:undefined}
          onNodeDragStart={editing?()=>pushHistory():undefined}
          onConnect={editing?connect:undefined}
          onNodeClick={nodeTap}
          onEdgeClick={editing?edgeTap:undefined}
          onPaneClick={editing&&!linkFromId?()=>{setSelectedNodeId(null);setSelectedEdgeId(null)}:undefined}
          nodesDraggable={editing}
          nodesConnectable={editing}
          elementsSelectable
          fitView
        >
          {editing&&<MiniMap/>}<Controls/><Background gap={22}/>
        </ReactFlow>
      </div>
      {!editing&&<p className="gameplan-graph-help">Recognized technique nodes are highlighted. Click one to open its Library/Discover information.</p>}
    </section>

    <div className="gameplan-info-grid">
      <section className="card gameplan-info-card">
        <div className="head"><div><small>AUTO + MANUAL TAGS</small><h3>What this system covers</h3></div><button className="icon" onClick={editDetails} aria-label="Edit manual tags"><Pencil size={15}/></button></div>
        <div className="chips">{tags.map(t=><span className="tag selected" key={t}>{t}</span>)}</div>
        <p className="auto-meta-note">{matches.length?('Updated from '+matches.length+' recognized graph technique'+(matches.length===1?'':'s')+' plus any manual tags.'):'Add recognizable technique names to the graph and tags will populate automatically.'}</p>
      </section>
      <section className="card gameplan-info-card">
        <div className="head"><div><small>NOTES</small><h3>System notes</h3></div><button className="icon" onClick={editDetails}><Pencil size={15}/></button></div>
        <p className={flow.description?'':'muted'}>{flow.description||'No notes added yet. Add a short gameplan cue, objective or reminder.'}</p>
      </section>
    </div>

    <section className="card gameplan-info-card">
      <div className="head"><div><small>AUTO LINKS + REFERENCES</small><h3>Technique videos from this system</h3></div><button className="icon" onClick={editDetails} aria-label="Edit manual references"><Pencil size={15}/></button></div>
      {refs.length?<div className="gameplan-ref-list">{refs.map(r=><a href={r.url} target="_blank" rel="noreferrer" key={r.url}><BookOpen size={17}/><span><b>{r.technique}</b><small>{r.label}</small></span><ExternalLink size={15}/></a>)}</div>:<p className="muted">No matching references yet. Link a node to a Library technique or use a recognizable technique name.</p>}
    </section>

    {linkPickerNodeId&&<TechniqueLinkPicker techniques={data.techniques} currentId={flow.nodes.find(n=>n.id===linkPickerNodeId)?.data.techniqueId} close={()=>setLinkPickerNodeId(null)} select={id=>setTechniqueLink(linkPickerNodeId,id)}/>}
    {nodeInfo&&<GameplanTechniqueDetail match={nodeInfo} close={()=>setNodeInfo(null)}/>}
    {metaOpen&&<SystemMetaForm flow={flow} close={()=>setMetaOpen(false)} save={async next=>{persist(next);setMetaOpen(false)}}/>}
    {trainer&&<Trainer flow={flow} close={()=>setTrainer(false)}/>}
  </div>
}

function TechniqueLinkPicker({techniques,currentId,close,select}:{techniques:Technique[];currentId?:string;close:()=>void;select:(id?:string)=>void}){
  const [q,setQ]=useState('')
  const list=techniques.filter(t=>(t.name+' '+t.category+' '+t.position).toLowerCase().includes(q.toLowerCase()))
  return <Modal title="Link node to technique" close={close}>
    <p className="muted">Linking is optional. If you leave it on auto-detect, BJJ Helper will keep matching the node name automatically.</p>
    <div className="search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search your Library…"/></div>
    <div className="technique-link-list">
      <button className={!currentId?'selected':''} onClick={()=>select(undefined)}><Sparkles size={16}/><span><b>Auto-detect</b><small>Match by node name</small></span></button>
      {list.map(t=><button className={currentId===t.id?'selected':''} key={t.id} onClick={()=>select(t.id)}><span className={'catalog-dot '+t.category.toLowerCase().replace(/\s/g,'-')}/><span><b>{t.name}</b><small>{t.category} · {t.position||'No position'} · {t.confidence}/5</small></span></button>)}
    </div>
  </Modal>
}

function GameplanTechniqueDetail({match,close}:{match:FlowTechniqueMatch;close:()=>void}){
  const p=match.personal,c=match.catalog
  return <Modal title={match.name} close={close}><div className="catalog-detail">
    <div className="chips"><span className="tag selected">{match.category==='Pass'?'Guard Pass':match.category}</span><span className="tag">{match.giMode}</span>{p&&<span className="tag blue">My Library</span>}</div>
    <p className="node-match-note">Opened from graph node “{match.label}”.</p>
    {p&&<div className="technique-detail-stats"><span><small>Confidence</small><b>{p.confidence}/5</b><em>{confidenceLabel(p.confidence)}</em></span><span><small>Drilled</small><b>{p.drillingCount}×</b></span><span><small>Position</small><b>{p.position||'Not set'}</b></span></div>}
    <h3>Description / notes</h3><p>{p?.notes||c?.description||'No description available yet.'}</p>
    {c?.keyPoints?.length?<><h3>Key points</h3><div className="detail-points">{c.keyPoints.map((x,i)=><div key={x}><span>{i+1}</span><p>{x}</p></div>)}</div></>:null}
    <h3>References</h3>
    <div className="reference-grid">
      {p?.videoUrl&&<a href={p.videoUrl} target="_blank" rel="noreferrer"><BookOpen size={17}/><span><b>{p.name} tutorial</b><small>Your saved reference</small></span><ExternalLink size={15}/></a>}
      {!p?.videoUrl&&c?.references.slice(0,2).map(r=><a key={r.url} href={r.url} target="_blank" rel="noreferrer"><BookOpen size={17}/><span><b>{r.label}</b><small>YouTube reference</small></span><ExternalLink size={15}/></a>)}
    </div>
  </div></Modal>
}

function SystemMetaForm({flow,close,save}:{flow:Flow;close:()=>void;save:(f:Flow)=>Promise<void>|void}){
  const [name,setName]=useState(flow.name)
  const [description,setDescription]=useState(flow.description)
  const [tags,setTags]=useState((flow.tags||[]).join(', '))
  const [refs,setRefs]=useState((flow.references||[]).length?flow.references:[{label:'',url:''}])
  const setRef=(i:number,key:'label'|'url',value:string)=>setRefs(r=>r.map((x,n)=>n===i?{...x,[key]:value}:x))
  const commit=()=>save({
    ...flow,
    name:name.trim()||flow.name,
    description:description.trim(),
    tags:tags.split(',').map(x=>x.trim()).filter(Boolean),
    references:refs.map(r=>({label:r.label.trim(),url:r.url.trim()})).filter(r=>r.label&&r.url),
    updatedAt:now()
  })
  return <Modal title="Edit system details" close={close}>
    <Field label="System name"><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Open Guard Passing"/></Field>
    <Field label="Notes"><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Goals, cues, reactions, reminders…"/></Field>
    <Field label="Tags"><input value={tags} onChange={e=>setTags(e.target.value)} placeholder="passing, open guard, pressure"/></Field>
    <div className="system-ref-editor">
      <div className="between"><div><small>REFERENCES</small><h4>Custom links</h4></div><button onClick={()=>setRefs(r=>[...r,{label:'',url:''}])}><CirclePlus size={15}/>Add link</button></div>
      {refs.map((r,i)=><div className="system-ref-row" key={i}>
        <input value={r.label} onChange={e=>setRef(i,'label',e.target.value)} placeholder="Label, e.g. Gordon Ryan Body Lock"/>
        <input value={r.url} onChange={e=>setRef(i,'url',e.target.value)} placeholder="https://youtube.com/…"/>
        <button className="icon danger" onClick={()=>setRefs(x=>x.filter((_,n)=>n!==i))}><Trash2 size={15}/></button>
      </div>)}
    </div>
    <button className="primary wide" onClick={commit}>Save system details</button>
  </Modal>
}

function Trainer({flow,close}:{flow:Flow;close:()=>void}){
  const options=flow.nodes.filter(n=>flow.edges.some(e=>e.source===n.id))
  const [i,setI]=useState(0),[show,setShow]=useState(false)
  const node=options[i%Math.max(options.length,1)]
  if(!node)return <Modal title="Decision trainer" close={close}><Empty>Add connected nodes first.</Empty></Modal>
  const next=flow.edges.filter(e=>e.source===node.id).map(e=>({e,n:flow.nodes.find(n=>n.id===e.target)})).filter(x=>x.n)
  return <Modal title="Decision trainer" close={close}><div className="trainer"><span className="badge">SITUATION</span><h2>{node.data.label}</h2><p>What is your planned response?</p>{show?<div className="answers">{next.map(x=><div key={x.e.id}><small>{x.e.label||'Next'}</small><b>{x.n?.data.label}</b></div>)}</div>:<button className="primary wide" onClick={()=>setShow(true)}>Reveal answer</button>}<button className="wide" onClick={()=>{setI(v=>v+1);setShow(false)}}>Next situation</button></div></Modal>
}

function Analytics({data,authUser}:{data:AppData;authUser:string|null}){
  const weekly=useMemo(()=>{const m=new Map<string,number>();data.sessions.forEach(s=>{const d=new Date(s.trainedAt);const k=new Intl.DateTimeFormat('sv-SE',{month:'short',day:'numeric'}).format(d);m.set(k,(m.get(k)||0)+1)});return [...m.entries()].slice(-8).map(([week,sessions])=>({week,sessions}))},[data.sessions])
  const mins=data.sessions.reduce((a,s)=>a+s.durationMin,0),rounds=data.sessions.reduce((a,s)=>a+s.rounds,0),subs=data.sessions.reduce((a,s)=>a+s.submissions,0),low=data.techniques.filter(t=>t.confidence<=2).length
  const last7=data.sessions.filter(s=>Date.now()-new Date(s.trainedAt).getTime()<7*864e5)
  const last7Avg=last7.length?last7.reduce((a,s)=>a+s.rating,0)/last7.length:0
  const techniqueUse=new Map<string,number>();last7.forEach(s=>s.techniqueIds.forEach(id=>techniqueUse.set(id,(techniqueUse.get(id)||0)+1)))
  const topId=[...techniqueUse.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]
  const topTechnique=data.techniques.find(t=>t.id===topId)?.name
  return <div className="stack"><Title eyebrow="PATTERNS, NOT VIBES" title="Analytics" text="Track consistency and expose holes in your game."><span/></Title><section className="metrics"><Metric icon={Clock3} label="Mat time" value={Math.round(mins/60)+'h'} hint="All time"/><Metric icon={Activity} label="Rounds" value={String(rounds)} hint="Logged"/><Metric icon={Trophy} label="Submissions" value={String(subs)} hint="Logged"/><Metric icon={Target} label="Low confidence" value={String(low)} hint="≤ 2/5"/></section><section className="card chart-card"><Head eyebrow="CONSISTENCY" title="Sessions trend" action="" click={()=>{}}/><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekly}><CartesianGrid stroke="#1d3029" vertical={false}/><XAxis dataKey="week" stroke="#758981" fontSize={10}/><YAxis stroke="#758981" allowDecimals={false} fontSize={10}/><Tooltip contentStyle={{background:'#0d1815',border:'1px solid #294039',borderRadius:10}}/><Bar dataKey="sessions" fill="#66e3b4" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></section><AIWeeklyReview data={data} authUser={authUser}/><section className="card weekly-review"><Head eyebrow="WEEKLY REVIEW" title="Your last 7 days" action="" click={()=>{}}/><div className="review-grid"><div><small>Sessions</small><b>{last7.length} / {data.profile.weeklySessionGoal||3}</b></div><div><small>Average feel</small><b>{last7Avg?last7Avg.toFixed(1)+'/5':'–'}</b></div><div><small>Most repeated</small><b>{topTechnique||'No signal yet'}</b></div><div><small>Focus</small><b>{data.profile.focusPosition||'Not set'}</b></div></div><p className="review-note">{last7.length<(data.profile.weeklySessionGoal||3)?'You are below your weekly session target. Prioritize showing up before adding more techniques.':low>0?'Volume is on target. Spend the next rounds on low-confidence positions instead of collecting new moves.':'Good consistency and no obvious confidence gap — keep sharpening your A-game.'}</p></section><section className="card"><Head eyebrow="AUTO REVIEW" title="What your data says" action="" click={()=>{}}/><div className="insights"><Insight title="Consistency" text={data.sessions.length<4?'Log a few more sessions before judging trends.':data.sessions.length+' sessions are now in your history.'}/><Insight title="Skill gaps" text={data.techniques.length?low+' techniques are currently rated low confidence.':'Add techniques and confidence ratings to map gaps.'}/><Insight title="Round trend" text={rounds?((subs/rounds).toFixed(2)+' submissions per logged round. Use this as a personal trend, not a score.'):'Log sparring rounds to unlock this signal.'}/></div></section></div>
}
function Insight({title,text}:{title:string;text:string}){return <div className="insight"><Sparkles size={16}/><div><b>{title}</b><p>{text}</p></div></div>}

function Coach({data,authUser}:{data:AppData;authUser:string|null}){
  const [msgs,setMsgs]=useState<{role:'user'|'assistant';text:string}[]>([{role:'assistant',text:'Ask about your last sessions, weak positions or what to focus on next.'}]),[input,setInput]=useState(''),[busy,setBusy]=useState(false)
  const local=(q:string)=>localCoachAnswer(data,q,navigator.language||'sv-SE')
  const send=async(q=input)=>{if(!q.trim())return;setMsgs(m=>[...m,{role:'user',text:q}]);setInput('');setBusy(true);try{let answer='';if(authUser&&supabase){const {data:r,error}=await supabase.functions.invoke('ai-coach',{body:{question:q,context:{profile:data.profile,techniques:data.techniques.slice(0,60),sessions:data.sessions.slice(0,20),flows:data.flows.slice(0,8)}}});if(error)throw error;answer=r?.answer||'No answer returned.'}else answer=local(q);setMsgs(m=>[...m,{role:'assistant',text:answer}])}catch(e:any){
    console.warn('Cloud AI unavailable, using hybrid local coach',e)
    setMsgs(m=>[...m,{role:'assistant',text:local(q)}])
  }finally{setBusy(false)}}
  return <div className="stack"><Title eyebrow="CONTEXT-AWARE COACH" title="AI Coach" text="Uses your own training log and gameplan as context. The API secret stays server-side."><span className="pill">{authUser?'Cloud AI':'Local coach'}</span></Title><div className="coach"><section className="chat"><div className="messages">{msgs.map((m,i)=><div key={i} className={'msg '+m.role}>{m.role==='assistant'&&<Brain size={16}/>}<span>{m.text}</span></div>)}{busy&&<div className="msg assistant"><Brain size={16}/><span>Thinking…</span></div>}</div><div className="compose"><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="What should I focus on?"/><button className="primary" onClick={()=>send()}>Send</button></div></section><aside className="prompts"><small>QUICK PROMPTS</small>{['Review my last week','Plan my next class','Find gaps in my game','Review my competition focus','Help simplify my gameplan'].map(x=><button onClick={()=>send(x)} key={x}>{x}<ChevronRight size={14}/></button>)}</aside></div></div>
}

function Profile({data,update,authUser,setAuthUser}:{data:AppData;update:any;authUser:string|null;setAuthUser:(x:string|null)=>void}){
  const [p,setP]=useState(data.profile),[email,setEmail]=useState(''),[pass,setPass]=useState(''),[status,setStatus]=useState('')
  const save=async()=>{update((d:AppData)=>({...d,profile:p}));if(authUser)await cloudUpsert('profile',p);setStatus('Saved')}
  const auth=async(kind:'in'|'up')=>{if(!supabase)return;setStatus('Working…');const r=kind==='up'?await supabase.auth.signUp({email,password:pass}):await supabase.auth.signInWithPassword({email,password:pass});setStatus(r.error?r.error.message:(kind==='up'?'Account created. Check email if confirmation is enabled.':'Signed in.'))}
  const out=async()=>{if(supabase)await supabase.auth.signOut();setAuthUser(null);setStatus('Signed out.')}
  const exportData=()=>{const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='bjj-helper-'+today()+'.json';a.click();URL.revokeObjectURL(u)}
  const importData=async(file:File)=>{try{const raw=JSON.parse(await file.text()) as AppData;if(!raw.profile||!Array.isArray(raw.sessions)||!Array.isArray(raw.techniques)||!Array.isArray(raw.flows))throw new Error();update(()=>raw);if(authUser){await cloudUpsert('profile',raw.profile);for(const t of raw.techniques)await cloudUpsert('technique',t);for(const s of raw.sessions)await cloudUpsert('session',s);for(const f of raw.flows)await cloudUpsert('flow',f)}setStatus('Backup imported.')}catch{setStatus('Invalid backup file.')}}
  return <div className="stack"><Title eyebrow="IDENTITY & SYNC" title="Profile" text="Private by default. Every cloud account gets its own rows and gameplan."><span/></Title><div className="cols"><section className="card"><Head eyebrow="ATHLETE" title="Your profile" action="" click={()=>{}}/><div className="form2"><Field label="Name"><input value={p.displayName} onChange={e=>setP({...p,displayName:e.target.value})}/></Field><Field label="Belt"><select value={p.belt} onChange={e=>setP({...p,belt:e.target.value as any})}>{['White','Blue','Purple','Brown','Black'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Stripes"><input type="number" min="0" max="4" value={p.stripes} onChange={e=>setP({...p,stripes:+e.target.value})}/></Field><Field label="Gym"><input value={p.gym} onChange={e=>setP({...p,gym:e.target.value})}/></Field><Field label="Weekly session goal"><input type="number" min="1" max="14" value={p.weeklySessionGoal} onChange={e=>setP({...p,weeklySessionGoal:+e.target.value})}/></Field><Field label="Current focus"><input value={p.focusPosition} onChange={e=>setP({...p,focusPosition:e.target.value})} placeholder="e.g. bottom half"/></Field><Field label="Competition date"><input type="date" value={p.competitionDate} onChange={e=>setP({...p,competitionDate:e.target.value})}/></Field><Field label="Competition target"><input value={p.competitionWeight} onChange={e=>setP({...p,competitionWeight:e.target.value})} placeholder="e.g. Heavy 94.3 kg"/></Field></div><button className="primary" onClick={save}>Save profile</button></section><section className="card"><Head eyebrow="CLOUD" title={cloudEnabled?'Private sync':'Supabase not connected'} action="" click={()=>{}}/>{cloudEnabled?(authUser?<div className="auth"><p><i className="dot on"/> Signed in. RLS isolates your data from other athletes.</p><button onClick={out}><LogOut size={15}/>Sign out</button></div>:<div className="auth"><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)}/><div className="actions"><button className="primary" onClick={()=>auth('in')}>Sign in</button><button onClick={()=>auth('up')}>Create account</button></div></div>):<div className="setup"><WifiOff size={24}/><p>The app works now in local mode. Connect a dedicated Supabase project for accounts, sync and real AI.</p><code>VITE_SUPABASE_URL<br/>VITE_SUPABASE_PUBLISHABLE_KEY</code></div>}{status&&<p className="status">{status}</p>}</section></div><section className="card"><Head eyebrow="DATA PORTABILITY" title="Import & export" action="" click={()=>{}}/><div className="actions"><button onClick={exportData}>Export JSON</button><label className="button-label">Import JSON<input hidden type="file" accept="application/json" onChange={e=>{const f=e.target.files?.[0];if(f)importData(f)}}/></label></div></section><section className="insights"><Insight title="Separate accounts" text="Every cloud record is owned by user_id and protected with Row Level Security."/><Insight title="Local-first" text="Without cloud configuration, data stays in that browser instead of becoming shared global state."/><Insight title="Safe AI" text="The OpenAI key is only read inside the server-side Edge Function."/></section></div>
}

function Title({eyebrow,title,text,children}:{eyebrow:string;title:string;text:string;children:any}){return <section className="title"><div><small>{eyebrow}</small><h2>{title}</h2><p>{text}</p></div>{children}</section>}
