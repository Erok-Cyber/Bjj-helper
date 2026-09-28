import { useEffect, useMemo, useState } from 'react'
import {
  Activity, BarChart3, BookOpen, Brain, ChevronRight, CirclePlus, Clock3,
  GitBranch, Home, LogOut, Menu, Search, Sparkles, Star, Swords, Target,
  Trophy, UserRound, WifiOff, X
} from 'lucide-react'
import {
  Background, Controls, MarkerType, MiniMap, ReactFlow, addEdge,
  applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange
} from '@xyflow/react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { AppData, Flow, Session, Technique } from './types'
import { cloudDelete, cloudUpsert, loadCloud, loadLocal, saveLocal } from './store'
import { cloudEnabled, supabase } from './supabase'

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
  const [syncing,setSyncing]=useState(false)

  useEffect(()=>{
    if(!supabase)return
    supabase.auth.getSession().then(async({data:{session}})=>{
      const id=session?.user.id||null; setAuthUser(id)
      if(id){setSyncing(true);try{setData(await loadCloud(id))}finally{setSyncing(false)}}
    })
    const {data:sub}=supabase.auth.onAuthStateChange(async(_e,session)=>{
      const id=session?.user.id||null;setAuthUser(id)
      if(id){setSyncing(true);try{setData(await loadCloud(id))}finally{setSyncing(false)}}
    })
    return()=>sub.subscription.unsubscribe()
  },[])

  useEffect(()=>{if(!authUser)saveLocal(data)},[data,authUser])
  const update=(fn:(d:AppData)=>AppData)=>setData(d=>fn(d))

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
        <div className="top-right">{!authUser&&<span className="pill"><WifiOff size={13}/> Local</span>}{syncing&&<span className="pill">Syncing…</span>}<button className="avatar" onClick={()=>setTab('profile')}>{data.profile.displayName.slice(0,1).toUpperCase()}</button></div>
      </header>
      <div className="page">
        {tab==='home'&&<Dashboard data={data} go={setTab}/>}
        {tab==='sessions'&&<Sessions data={data} update={update} authUser={authUser}/>}
        {tab==='techniques'&&<Techniques data={data} update={update} authUser={authUser}/>}
        {tab==='flows'&&<Flows data={data} update={update} authUser={authUser}/>}
        {tab==='analytics'&&<Analytics data={data}/>}
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
function Modal({title,close,children}:{title:string;close:()=>void;children:any}){return <div className="modal-bg" onMouseDown={close}><section className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><h3>{title}</h3><button className="icon" onClick={close}><X size={18}/></button></div>{children}</section></div>}
function Field({label,children}:{label:string;children:any}){return <label className="field"><span>{label}</span>{children}</label>}

function Dashboard({data,go}:{data:AppData;go:(t:Tab)=>void}){
  const week=data.sessions.filter(s=>Date.now()-new Date(s.trainedAt).getTime()<7*864e5)
  const minutes=week.reduce((a,s)=>a+s.durationMin,0)
  const rounds=week.reduce((a,s)=>a+s.rounds,0)
  const avg=week.length?week.reduce((a,s)=>a+s.rating,0)/week.length:0
  const low=[...data.techniques].sort((a,b)=>a.confidence-b.confidence).slice(0,3)
  return <div className="stack">
    <section className="hero"><div><span className="badge"><Sparkles size={13}/> PERSONAL BJJ OS</span><h2>Build a game you can actually execute.</h2><p>Track what happens on the mat, connect techniques into systems and train the decisions between them.</p><div className="actions"><button className="primary" onClick={()=>go('sessions')}><CirclePlus size={17}/>Log session</button><button onClick={()=>go('coach')}><Brain size={17}/>Ask AI coach</button></div></div><div className="hero-score"><b>{week.length}</b><span>sessions<br/>this week</span></div></section>
    <section className="metrics"><Metric icon={Clock3} label="Mat time" value={(minutes/60).toFixed(1)+'h'} hint="Last 7 days"/><Metric icon={Activity} label="Rounds" value={String(rounds)} hint="Last 7 days"/><Metric icon={BookOpen} label="Techniques" value={String(data.techniques.length)} hint="Your library"/><Metric icon={Star} label="Session feel" value={avg?avg.toFixed(1):'–'} hint="Average / 5"/></section>
    <div className="cols">
      <section className="card"><Head eyebrow="RECENT" title="Training sessions" action="View all" click={()=>go('sessions')}/>{data.sessions.length?<div className="rows">{[...data.sessions].sort((a,b)=>b.trainedAt.localeCompare(a.trainedAt)).slice(0,4).map(s=><div className="row" key={s.id}><span className="date"><b>{new Date(s.trainedAt).getDate()}</b><small>{fmt(s.trainedAt).split(' ')[1]}</small></span><div><b>{s.mode} · {s.durationMin} min</b><small>{s.rounds} rounds · {s.submissions} submissions</small></div><strong>★ {s.rating}</strong></div>)}</div>:<Empty>Log your first session to start building trends.</Empty>}</section>
      <section className="card"><Head eyebrow="NEXT UP" title="Skill gaps" action="Library" click={()=>go('techniques')}/>{low.length?<div className="rows">{low.map(t=><div className="row" key={t.id}><span className="confidence"><i style={{width:(t.confidence*20)+'%'}}/></span><div><b>{t.name}</b><small>{t.position||'No position'} · {t.category}</small></div><span className="tag">{t.confidence}/5</span></div>)}</div>:<Empty>Add techniques and rate confidence to reveal gaps.</Empty>}</section>
    </div>
    <section className="card"><Head eyebrow="YOUR SYSTEM" title="Gameplan flows" action="Open builder" click={()=>go('flows')}/><div className="flow-list">{data.flows.map(f=><div className="flow-mini" key={f.id}><GitBranch size={18}/><div><b>{f.name}</b><small>{f.nodes.length} nodes · {f.edges.length} links</small></div></div>)}</div></section>
  </div>
}
function Head({eyebrow,title,action,click}:{eyebrow:string;title:string;action:string;click:()=>void}){return <div className="head"><div><small>{eyebrow}</small><h3>{title}</h3></div><button className="link" onClick={click}>{action}<ChevronRight size={14}/></button></div>}

function Sessions({data,update,authUser}:{data:AppData;update:any;authUser:string|null}){
  const [open,setOpen]=useState(false),[q,setQ]=useState('')
  const list=[...data.sessions].filter(s=>(s.notes+' '+s.mode).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>b.trainedAt.localeCompare(a.trainedAt))
  const add=async(s:Session)=>{update((d:AppData)=>({...d,sessions:[s,...d.sessions]}));if(authUser)await cloudUpsert('session',s);setOpen(false)}
  const del=async(id:string)=>{update((d:AppData)=>({...d,sessions:d.sessions.filter(s=>s.id!==id)}));if(authUser)await cloudDelete('sessions',id)}
  return <div className="stack"><Title eyebrow="TRAINING JOURNAL" title="Sessions" text="Quick enough for mat-side logging, detailed enough for useful patterns."><button className="primary" onClick={()=>setOpen(true)}><CirclePlus size={17}/>New session</button></Title><div className="filter"><div className="search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search sessions…"/></div><span className="pill">{list.length} logged</span></div><div className="grid3">{list.length?list.map(s=><article className="session" key={s.id}><div className="between"><span className={s.mode==='Gi'?'tag blue':'tag purple'}>{s.mode}</span><button className="icon danger" onClick={()=>del(s.id)}><X size={15}/></button></div><h3>{fmt(s.trainedAt)}</h3><div className="session-stats"><span><b>{s.durationMin}</b>min</span><span><b>{s.rounds}</b>rounds</span><span><b>{s.submissions}</b>subs</span><span><b>{s.taps}</b>taps</span></div><div className="stars">{[1,2,3,4,5].map(n=><i className={n<=s.rating?'on':''} key={n}>★</i>)}</div>{s.notes&&<p>{s.notes}</p>}<div className="chips">{s.techniqueIds.map(id=>{const t=data.techniques.find(x=>x.id===id);return t?<span className="tag" key={id}>{t.name}</span>:null})}</div></article>):<Empty>No sessions yet.</Empty>}</div>{open&&<SessionForm techniques={data.techniques} close={()=>setOpen(false)} save={add}/>}</div>
}
function SessionForm({techniques,close,save}:{techniques:Technique[];close:()=>void;save:(s:Session)=>void}){
  const [f,setF]=useState({trainedAt:today(),mode:'Gi' as 'Gi'|'No-Gi',durationMin:90,rounds:5,submissions:0,taps:0,rating:4,notes:'',techniqueIds:[] as string[],partners:''})
  const toggle=(id:string)=>setF(v=>({...v,techniqueIds:v.techniqueIds.includes(id)?v.techniqueIds.filter(x=>x!==id):[...v.techniqueIds,id]}))
  return <Modal title="Log session" close={close}><div className="form2"><Field label="Date"><input type="date" value={f.trainedAt} onChange={e=>setF({...f,trainedAt:e.target.value})}/></Field><Field label="Type"><select value={f.mode} onChange={e=>setF({...f,mode:e.target.value as any})}><option>Gi</option><option>No-Gi</option></select></Field><Field label="Minutes"><input type="number" value={f.durationMin} onChange={e=>setF({...f,durationMin:+e.target.value})}/></Field><Field label="Rounds"><input type="number" value={f.rounds} onChange={e=>setF({...f,rounds:+e.target.value})}/></Field><Field label="Submissions"><input type="number" value={f.submissions} onChange={e=>setF({...f,submissions:+e.target.value})}/></Field><Field label="Tapped"><input type="number" value={f.taps} onChange={e=>setF({...f,taps:+e.target.value})}/></Field></div><Field label="Rating"><div className="rate">{[1,2,3,4,5].map(n=><button className={n<=f.rating?'on':''} onClick={()=>setF({...f,rating:n})} key={n}>★</button>)}</div></Field><Field label="Techniques used"><div className="pick">{techniques.map(t=><button className={f.techniqueIds.includes(t.id)?'on':''} onClick={()=>toggle(t.id)} key={t.id}>{t.name}</button>)}</div></Field><Field label="Partners"><input value={f.partners} onChange={e=>setF({...f,partners:e.target.value})} placeholder="Optional, comma separated"/></Field><Field label="Notes"><textarea value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="What worked? What failed?"/></Field><button className="primary wide" onClick={()=>save({id:uid(),...f,partners:f.partners.split(',').map(x=>x.trim()).filter(Boolean),createdAt:now()})}>Save session</button></Modal>
}

function Techniques({data,update,authUser}:{data:AppData;update:any;authUser:string|null}){
  const [open,setOpen]=useState(false),[q,setQ]=useState(''),[cat,setCat]=useState('All')
  const cats=['All','Takedown','Guard','Pass','Sweep','Escape','Submission','Control','Other']
  const list=data.techniques.filter(t=>(cat==='All'||t.category===cat)&&(t.name+' '+t.position+' '+t.tags.join(' ')).toLowerCase().includes(q.toLowerCase()))
  const add=async(t:Technique)=>{update((d:AppData)=>({...d,techniques:[t,...d.techniques]}));if(authUser)await cloudUpsert('technique',t);setOpen(false)}
  const del=async(id:string)=>{update((d:AppData)=>({...d,techniques:d.techniques.filter(t=>t.id!==id)}));if(authUser)await cloudDelete('techniques',id)}
  return <div className="stack"><Title eyebrow="PERSONAL KNOWLEDGE BASE" title="Technique library" text="Save the details that matter: position, cues, links, tags and confidence."><button className="primary" onClick={()=>setOpen(true)}><CirclePlus size={17}/>Add technique</button></Title><div className="filter wrap"><div className="search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search techniques…"/></div><div className="chips">{cats.map(c=><button className={cat===c?'tag selected':'tag'} onClick={()=>setCat(c)} key={c}>{c}</button>)}</div></div><div className="grid3">{list.length?list.map(t=><article className="tech" key={t.id}><div className="between"><span className="tag">{t.category}</span><button className="icon danger" onClick={()=>del(t.id)}><X size={15}/></button></div><h3>{t.name}</h3><p className="muted">{t.position||'No position'} · {t.giMode}</p><span className="confidence big"><i style={{width:(t.confidence*20)+'%'}}/></span><div className="between tiny"><span>Confidence {t.confidence}/5</span><span>Drilled {t.drillingCount}×</span></div>{t.notes&&<p>{t.notes}</p>}<div className="chips">{t.tags.map(x=><span className="tag" key={x}>#{x}</span>)}</div>{t.videoUrl&&<a className="link" href={t.videoUrl} target="_blank" rel="noreferrer">Open tutorial<ChevronRight size={14}/></a>}</article>):<Empty>Your library is empty.</Empty>}</div>{open&&<TechniqueForm close={()=>setOpen(false)} save={add}/>}</div>
}
function TechniqueForm({close,save}:{close:()=>void;save:(t:Technique)=>void}){
  const [f,setF]=useState({name:'',category:'Takedown',position:'',giMode:'Both',notes:'',videoUrl:'',tags:'',confidence:2})
  return <Modal title="Add technique" close={close}><div className="form2"><Field label="Name"><input value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Field><Field label="Category"><select value={f.category} onChange={e=>setF({...f,category:e.target.value})}>{['Takedown','Guard','Pass','Sweep','Escape','Submission','Control','Other'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Position"><input value={f.position} onChange={e=>setF({...f,position:e.target.value})}/></Field><Field label="Mode"><select value={f.giMode} onChange={e=>setF({...f,giMode:e.target.value})}><option>Both</option><option>Gi</option><option>No-Gi</option></select></Field></div><Field label="Confidence"><input type="range" min="1" max="5" value={f.confidence} onChange={e=>setF({...f,confidence:+e.target.value})}/></Field><Field label="Tutorial link"><input value={f.videoUrl} onChange={e=>setF({...f,videoUrl:e.target.value})} placeholder="YouTube / instructional"/></Field><Field label="Tags"><input value={f.tags} onChange={e=>setF({...f,tags:e.target.value})} placeholder="pressure, A-game, competition"/></Field><Field label="Notes"><textarea value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/></Field><button className="primary wide" disabled={!f.name.trim()} onClick={()=>save({id:uid(),name:f.name.trim(),category:f.category as any,position:f.position,giMode:f.giMode as any,notes:f.notes,videoUrl:f.videoUrl,tags:f.tags.split(',').map(x=>x.trim()).filter(Boolean),confidence:f.confidence,drillingCount:0,createdAt:now(),updatedAt:now()})}>Add technique</button></Modal>
}

function Flows({data,update,authUser}:{data:AppData;update:any;authUser:string|null}){
  const [activeId,setActiveId]=useState(data.flows[0]?.id||''),[trainer,setTrainer]=useState(false)
  const flow=data.flows.find(f=>f.id===activeId)||data.flows[0]
  if(!flow)return <Empty>No flows.</Empty>
  const persist=async(next:Flow)=>{update((d:AppData)=>({...d,flows:d.flows.map(f=>f.id===next.id?next:f)}));if(authUser)await cloudUpsert('flow',next)}
  const nodes=(changes:NodeChange[])=>persist({...flow,nodes:applyNodeChanges(changes,flow.nodes as any) as any,updatedAt:now()})
  const edges=(changes:EdgeChange[])=>persist({...flow,edges:applyEdgeChanges(changes,flow.edges as any) as any,updatedAt:now()})
  const connect=(c:Connection)=>persist({...flow,edges:addEdge({...c,markerEnd:{type:MarkerType.ArrowClosed}},flow.edges as any) as any,updatedAt:now()})
  const addNode=()=>persist({...flow,nodes:[...flow.nodes,{id:uid(),position:{x:100+Math.random()*400,y:80+Math.random()*300},data:{label:'New step',kind:'technique'}}],updatedAt:now()})
  const addFlow=()=>{const f:Flow={id:uid(),name:'New gameplan',description:'',nodes:[],edges:[],createdAt:now(),updatedAt:now()};update((d:AppData)=>({...d,flows:[...d.flows,f]}));setActiveId(f.id);if(authUser)cloudUpsert('flow',f)}
  return <div className="stack"><Title eyebrow="SYSTEMS OVER MOVES" title="Gameplan builder" text="Map positions, opponent reactions and your preferred responses into a decision tree."><div className="actions"><button onClick={()=>setTrainer(true)}><Target size={16}/>Decision trainer</button><button className="primary" onClick={addFlow}><CirclePlus size={16}/>New flow</button></div></Title><div className="flow-tabs">{data.flows.map(f=><button className={f.id===flow.id?'selected':''} key={f.id} onClick={()=>setActiveId(f.id)}>{f.name}</button>)}</div><section className="flow-box"><div className="flow-top"><div><b>{flow.name}</b><small>{flow.nodes.length} nodes · connect handles to build logic</small></div><button onClick={addNode}><CirclePlus size={15}/>Node</button></div><div className="canvas"><ReactFlow nodes={flow.nodes as any} edges={flow.edges as any} onNodesChange={nodes} onEdgesChange={edges} onConnect={connect} fitView><MiniMap/><Controls/><Background gap={22}/></ReactFlow></div></section>{trainer&&<Trainer flow={flow} close={()=>setTrainer(false)}/>}</div>
}
function Trainer({flow,close}:{flow:Flow;close:()=>void}){
  const options=flow.nodes.filter(n=>flow.edges.some(e=>e.source===n.id))
  const [i,setI]=useState(0),[show,setShow]=useState(false)
  const node=options[i%Math.max(options.length,1)]
  if(!node)return <Modal title="Decision trainer" close={close}><Empty>Add connected nodes first.</Empty></Modal>
  const next=flow.edges.filter(e=>e.source===node.id).map(e=>({e,n:flow.nodes.find(n=>n.id===e.target)})).filter(x=>x.n)
  return <Modal title="Decision trainer" close={close}><div className="trainer"><span className="badge">SITUATION</span><h2>{node.data.label}</h2><p>What is your planned response?</p>{show?<div className="answers">{next.map(x=><div key={x.e.id}><small>{x.e.label||'Next'}</small><b>{x.n?.data.label}</b></div>)}</div>:<button className="primary wide" onClick={()=>setShow(true)}>Reveal answer</button>}<button className="wide" onClick={()=>{setI(v=>v+1);setShow(false)}}>Next situation</button></div></Modal>
}

function Analytics({data}:{data:AppData}){
  const weekly=useMemo(()=>{const m=new Map<string,number>();data.sessions.forEach(s=>{const d=new Date(s.trainedAt);const k=new Intl.DateTimeFormat('sv-SE',{month:'short',day:'numeric'}).format(d);m.set(k,(m.get(k)||0)+1)});return [...m.entries()].slice(-8).map(([week,sessions])=>({week,sessions}))},[data.sessions])
  const mins=data.sessions.reduce((a,s)=>a+s.durationMin,0),rounds=data.sessions.reduce((a,s)=>a+s.rounds,0),subs=data.sessions.reduce((a,s)=>a+s.submissions,0),low=data.techniques.filter(t=>t.confidence<=2).length
  return <div className="stack"><Title eyebrow="PATTERNS, NOT VIBES" title="Analytics" text="Track consistency and expose holes in your game."><span/></Title><section className="metrics"><Metric icon={Clock3} label="Mat time" value={Math.round(mins/60)+'h'} hint="All time"/><Metric icon={Activity} label="Rounds" value={String(rounds)} hint="Logged"/><Metric icon={Trophy} label="Submissions" value={String(subs)} hint="Logged"/><Metric icon={Target} label="Low confidence" value={String(low)} hint="≤ 2/5"/></section><section className="card chart-card"><Head eyebrow="CONSISTENCY" title="Sessions trend" action="" click={()=>{}}/><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekly}><CartesianGrid stroke="#1d3029" vertical={false}/><XAxis dataKey="week" stroke="#758981" fontSize={10}/><YAxis stroke="#758981" allowDecimals={false} fontSize={10}/><Tooltip contentStyle={{background:'#0d1815',border:'1px solid #294039',borderRadius:10}}/><Bar dataKey="sessions" fill="#66e3b4" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></section><section className="card"><Head eyebrow="AUTO REVIEW" title="What your data says" action="" click={()=>{}}/><div className="insights"><Insight title="Consistency" text={data.sessions.length<4?'Log a few more sessions before judging trends.':data.sessions.length+' sessions are now in your history.'}/><Insight title="Skill gaps" text={data.techniques.length?low+' techniques are currently rated low confidence.':'Add techniques and confidence ratings to map gaps.'}/><Insight title="Round trend" text={rounds?((subs/rounds).toFixed(2)+' submissions per logged round. Use this as a personal trend, not a score.'):'Log sparring rounds to unlock this signal.'}/></div></section></div>
}
function Insight({title,text}:{title:string;text:string}){return <div className="insight"><Sparkles size={16}/><div><b>{title}</b><p>{text}</p></div></div>}

function Coach({data,authUser}:{data:AppData;authUser:string|null}){
  const [msgs,setMsgs]=useState<{role:'user'|'assistant';text:string}[]>([{role:'assistant',text:'Ask about your last sessions, weak positions or what to focus on next.'}]),[input,setInput]=useState(''),[busy,setBusy]=useState(false)
  const local=(q:string)=>{const low=[...data.techniques].sort((a,b)=>a.confidence-b.confidence).slice(0,3);return `Local review: ${data.sessions.length} sessions logged. ${low.length?'Lowest-confidence techniques: '+low.map(x=>x.name).join(', ')+'.':'Add confidence ratings to improve recommendations.'} For “${q}”, choose one position and one reaction to focus on in your next live rounds.`}
  const send=async(q=input)=>{if(!q.trim())return;setMsgs(m=>[...m,{role:'user',text:q}]);setInput('');setBusy(true);try{let answer='';if(authUser&&supabase){const {data:r,error}=await supabase.functions.invoke('ai-coach',{body:{question:q,context:{profile:data.profile,techniques:data.techniques.slice(0,60),sessions:data.sessions.slice(0,20),flows:data.flows.slice(0,8)}}});if(error)throw error;answer=r?.answer||'No answer returned.'}else answer=local(q);setMsgs(m=>[...m,{role:'assistant',text:answer}])}catch{setMsgs(m=>[...m,{role:'assistant',text:'Cloud AI is not connected yet. Your local data is still safe.'}])}finally{setBusy(false)}}
  return <div className="stack"><Title eyebrow="CONTEXT-AWARE COACH" title="AI Coach" text="Uses your own training log and gameplan as context. The API secret stays server-side."><span className="pill">{authUser?'Cloud AI':'Local coach'}</span></Title><div className="coach"><section className="chat"><div className="messages">{msgs.map((m,i)=><div key={i} className={'msg '+m.role}>{m.role==='assistant'&&<Brain size={16}/>}<span>{m.text}</span></div>)}{busy&&<div className="msg assistant"><Brain size={16}/><span>Thinking…</span></div>}</div><div className="compose"><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="What should I focus on?"/><button className="primary" onClick={()=>send()}>Send</button></div></section><aside className="prompts"><small>QUICK PROMPTS</small>{['Review my last week','Find gaps in my game','Give me one drilling focus','Help simplify my gameplan'].map(x=><button onClick={()=>send(x)} key={x}>{x}<ChevronRight size={14}/></button>)}</aside></div></div>
}

function Profile({data,update,authUser,setAuthUser}:{data:AppData;update:any;authUser:string|null;setAuthUser:(x:string|null)=>void}){
  const [p,setP]=useState(data.profile),[email,setEmail]=useState(''),[pass,setPass]=useState(''),[status,setStatus]=useState('')
  const save=async()=>{update((d:AppData)=>({...d,profile:p}));if(authUser)await cloudUpsert('profile',p);setStatus('Saved')}
  const auth=async(kind:'in'|'up')=>{if(!supabase)return;setStatus('Working…');const r=kind==='up'?await supabase.auth.signUp({email,password:pass}):await supabase.auth.signInWithPassword({email,password:pass});setStatus(r.error?r.error.message:(kind==='up'?'Account created. Check email if confirmation is enabled.':'Signed in.'))}
  const out=async()=>{if(supabase)await supabase.auth.signOut();setAuthUser(null);setStatus('Signed out.')}
  const exportData=()=>{const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='bjj-helper-'+today()+'.json';a.click();URL.revokeObjectURL(u)}
  const importData=async(file:File)=>{try{const raw=JSON.parse(await file.text()) as AppData;if(!raw.profile||!Array.isArray(raw.sessions)||!Array.isArray(raw.techniques)||!Array.isArray(raw.flows))throw new Error();update(()=>raw);if(authUser){await cloudUpsert('profile',raw.profile);for(const t of raw.techniques)await cloudUpsert('technique',t);for(const s of raw.sessions)await cloudUpsert('session',s);for(const f of raw.flows)await cloudUpsert('flow',f)}setStatus('Backup imported.')}catch{setStatus('Invalid backup file.')}}
  return <div className="stack"><Title eyebrow="IDENTITY & SYNC" title="Profile" text="Private by default. Every cloud account gets its own rows and gameplan."><span/></Title><div className="cols"><section className="card"><Head eyebrow="ATHLETE" title="Your profile" action="" click={()=>{}}/><div className="form2"><Field label="Name"><input value={p.displayName} onChange={e=>setP({...p,displayName:e.target.value})}/></Field><Field label="Belt"><select value={p.belt} onChange={e=>setP({...p,belt:e.target.value as any})}>{['White','Blue','Purple','Brown','Black'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Stripes"><input type="number" min="0" max="4" value={p.stripes} onChange={e=>setP({...p,stripes:+e.target.value})}/></Field><Field label="Gym"><input value={p.gym} onChange={e=>setP({...p,gym:e.target.value})}/></Field></div><button className="primary" onClick={save}>Save profile</button></section><section className="card"><Head eyebrow="CLOUD" title={cloudEnabled?'Private sync':'Supabase not connected'} action="" click={()=>{}}/>{cloudEnabled?(authUser?<div className="auth"><p><i className="dot on"/> Signed in. RLS isolates your data from other athletes.</p><button onClick={out}><LogOut size={15}/>Sign out</button></div>:<div className="auth"><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)}/><div className="actions"><button className="primary" onClick={()=>auth('in')}>Sign in</button><button onClick={()=>auth('up')}>Create account</button></div></div>):<div className="setup"><WifiOff size={24}/><p>The app works now in local mode. Connect a dedicated Supabase project for accounts, sync and real AI.</p><code>VITE_SUPABASE_URL<br/>VITE_SUPABASE_PUBLISHABLE_KEY</code></div>}{status&&<p className="status">{status}</p>}</section></div><section className="card"><Head eyebrow="DATA PORTABILITY" title="Import & export" action="" click={()=>{}}/><div className="actions"><button onClick={exportData}>Export JSON</button><label className="button-label">Import JSON<input hidden type="file" accept="application/json" onChange={e=>{const f=e.target.files?.[0];if(f)importData(f)}}/></label></div></section><section className="insights"><Insight title="Separate accounts" text="Every cloud record is owned by user_id and protected with Row Level Security."/><Insight title="Local-first" text="Without cloud configuration, data stays in that browser instead of becoming shared global state."/><Insight title="Safe AI" text="The OpenAI key is only read inside the server-side Edge Function."/></section></div>
}

function Title({eyebrow,title,text,children}:{eyebrow:string;title:string;text:string;children:any}){return <section className="title"><div><small>{eyebrow}</small><h2>{title}</h2><p>{text}</p></div>{children}</section>}
