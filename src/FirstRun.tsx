import { useState } from 'react'
import { ArrowRight, Check, Swords } from 'lucide-react'
import type { Profile } from './types'
import { supabase } from './supabase'

export function AuthGate() {
  const [mode,setMode]=useState<'in'|'up'>('up')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [busy,setBusy]=useState(false)
  const [status,setStatus]=useState('')

  const submit=async()=>{
    if(!supabase||!email||password.length<6)return
    setBusy(true);setStatus('')
    const result=mode==='up'
      ? await supabase.auth.signUp({email,password})
      : await supabase.auth.signInWithPassword({email,password})
    setBusy(false)
    if(result.error)setStatus(result.error.message)
    else if(mode==='up'&&!result.data.session)setStatus('Account created. Check your email to confirm, then sign in.')
    else setStatus('Signed in.')
  }

  return <main className="first-run">
    <section className="auth-panel">
      <div className="brand auth-brand"><span><Swords size={22}/></span><div><b>BJJ Helper</b><small>Your personal training OS</small></div></div>
      <span className="badge">PRIVATE BY DEFAULT</span>
      <h1>{mode==='up'?'Create your athlete profile':'Welcome back'}</h1>
      <p>Your techniques, sessions, flows and AI reviews stay attached to your account.</p>
      <div className="auth-switch">
        <button className={mode==='up'?'selected':''} onClick={()=>setMode('up')}>Create account</button>
        <button className={mode==='in'?'selected':''} onClick={()=>setMode('in')}>Sign in</button>
      </div>
      <label className="field"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
      <label className="field"><span>Password</span><input type="password" autoComplete={mode==='up'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label>
      <button className="primary wide onboarding-next" disabled={busy||!email||password.length<6} onClick={submit}>{busy?'Working…':mode==='up'?'Create account':'Sign in'}<ArrowRight size={16}/></button>
      {status&&<p className="auth-status">{status}</p>}
    </section>
  </main>
}

export function Onboarding({profile,onComplete,cloud}:{profile:Profile;onComplete:(profile:Profile)=>Promise<void>|void;cloud:boolean}) {
  const [step,setStep]=useState(0)
  const [p,setP]=useState(profile)
  const [busy,setBusy]=useState(false)
  const steps=4

  const next=()=>setStep(s=>Math.min(steps-1,s+1))
  const finish=async()=>{
    setBusy(true)
    await onComplete({...p,onboardingCompleted:true})
    setBusy(false)
  }

  return <main className="first-run">
    <section className="onboarding-card">
      <div className="onboarding-top"><div className="brand"><span><Swords size={20}/></span><div><b>BJJ Helper</b><small>{cloud?'Setting up your account':'Local preview setup'}</small></div></div><span>{step+1} / {steps}</span></div>
      <div className="onboarding-progress"><i style={{width:((step+1)/steps*100)+'%'}}/></div>

      {step===0&&<div className="onboarding-step">
        <span className="badge">LET'S START</span>
        <h1>What should we call you?</h1>
        <p>This is the name shown on your dashboard and training profile.</p>
        <input autoFocus value={p.displayName==='Local athlete'?'':p.displayName} onChange={e=>setP({...p,displayName:e.target.value})} placeholder="Your name"/>
        <button className="primary onboarding-next" disabled={!p.displayName.trim()||p.displayName==='Local athlete'} onClick={next}>Continue<ArrowRight size={17}/></button>
      </div>}

      {step===1&&<div className="onboarding-step">
        <span className="badge">YOUR LEVEL</span>
        <h1>What's your current rank?</h1>
        <p>We'll use it to keep recommendations appropriate for your experience.</p>
        <div className="belt-grid">{(['White','Blue','Purple','Brown','Black'] as Profile['belt'][]).map(b=><button key={b} className={p.belt===b?'belt-choice selected':'belt-choice'} onClick={()=>setP({...p,belt:b,stripes:b==='Black'?0:p.stripes})}><i className={'belt-dot '+b.toLowerCase()}/>{b} belt{p.belt===b&&<Check size={15}/>}</button>)}</div>
        {p.belt!=='Black'&&<div className="stripe-picker"><span>Stripes</span><div>{[0,1,2,3,4].map(n=><button key={n} className={p.stripes===n?'selected':''} onClick={()=>setP({...p,stripes:n})}>{n}</button>)}</div></div>}
        <button className="primary onboarding-next" onClick={next}>Continue<ArrowRight size={17}/></button>
      </div>}

      {step===2&&<div className="onboarding-step">
        <span className="badge">TRAINING RHYTHM</span>
        <h1>How often do you want to train?</h1>
        <p>This becomes your weekly consistency target. You can change it anytime.</p>
        <div className="goal-picker">{[2,3,4,5,6].map(n=><button key={n} className={p.weeklySessionGoal===n?'selected':''} onClick={()=>setP({...p,weeklySessionGoal:n})}><b>{n}</b><small>sessions / week</small></button>)}</div>
        <button className="primary onboarding-next" onClick={next}>Continue<ArrowRight size={17}/></button>
      </div>}

      {step===3&&<div className="onboarding-step">
        <span className="badge">YOUR GAME</span>
        <h1>What are you working on right now?</h1>
        <p>Optional — this gives the dashboard and AI reviews a starting focus.</p>
        <input value={p.focusPosition} onChange={e=>setP({...p,focusPosition:e.target.value})} placeholder="e.g. guard passing, bottom half, stand-up"/>
        <button className="primary onboarding-next" disabled={busy} onClick={finish}>{busy?'Saving…':'Enter BJJ Helper'}<ArrowRight size={17}/></button>
        <button className="link onboarding-skip" disabled={busy} onClick={()=>{setP({...p,focusPosition:''});finish()}}>Skip for now</button>
      </div>}
    </section>
  </main>
}
