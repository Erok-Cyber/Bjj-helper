import BeltMark from './BeltMark'
import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import type { Profile } from './types'
import { getAuthRedirectUrl, supabase } from './supabase'

export function AuthGate() {
  const [mode,setMode]=useState<'in'|'up'|'admin'>('up')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [busy,setBusy]=useState(false)
  const [status,setStatus]=useState('')

  const submit=async()=>{
    if(busy||!supabase||!email.trim()||password.length<6)return
    setBusy(true);setStatus('')
    try {
    if(mode==='admin'){
      const {data,error}=await supabase.functions.invoke('admin-login',{body:{username:email.trim(),password}})
      if(error||!data?.session){setStatus('Could not sign in. Check your username and password, or try again later.');return}
      const {error:sessionError}=await supabase.auth.setSession(data.session)
      setPassword('');setStatus(sessionError?'Could not start your session. Please try again.':'Signed in.')
      return
    }
    const result=mode==='up'
      ? await supabase.auth.signUp({
          email: email.trim(),
          password,
          options:{ emailRedirectTo: getAuthRedirectUrl() }
        })
      : await supabase.auth.signInWithPassword({email: email.trim(),password})
    if(result.error)setStatus(result.error.message)
    else if(mode==='up'&&!result.data.session)setStatus('Account created. Check your email to confirm, then sign in.')
    else setStatus('Signed in.')
    } catch {
      setStatus('Could not connect. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const resendConfirmation=async()=>{
    if(busy||!email.trim())return
    setBusy(true);setStatus('')
    try {
      const {error}=await supabase.auth.resend({
        type:'signup',
        email:email.trim(),
        options:{emailRedirectTo:getAuthRedirectUrl()}
      })
      setStatus(error?error.message:'If this account needs confirmation, a new email has been sent. Use the newest link and check your spam folder.')
    } catch {
      setStatus('Could not send the email. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="first-run">
    <section className="auth-panel">
      <div className="brand auth-brand"><span><BeltMark size={26}/></span><div><b>GrappleLog</b><small>{mode==='admin'?'Administration':'Your personal training OS'}</small></div></div>
      <span className="badge">PRIVATE BY DEFAULT</span>
      <h1>{mode==='admin'?'Administrator sign-in':mode==='up'?'Create your athlete profile':'Welcome back'}</h1>
      <p>{mode==='admin'?'Sign in with your administrator username and password.':'Your techniques, sessions, flows and AI reviews stay attached to your account.'}</p>
      {mode!=='admin'&&<div className="auth-switch">
        <button className={mode==='up'?'selected':''} onClick={()=>setMode('up')}>Create account</button>
        <button className={mode==='in'?'selected':''} onClick={()=>setMode('in')}>Sign in</button>
      </div>}
      <label className="field"><span>{mode==='admin'?'Username':'Email'}</span><input type={mode==='admin'?'text':'email'} autoComplete={mode==='admin'?'username':'email'} value={email} onChange={e=>setEmail(e.target.value)} placeholder={mode==='admin'?'Admin username':'you@example.com'}/></label>
      <label className="field"><span>Password</span><input type="password" autoComplete={mode==='up'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label>
      <button className="primary wide onboarding-next" disabled={busy||!email||password.length<6} onClick={submit}>{busy?'Working…':mode==='up'?'Create account':'Sign in'}<ArrowRight size={16}/></button>
      {mode!=='admin'&&<button className="link" disabled={busy||!email.trim()} onClick={resendConfirmation}>Resend confirmation email</button>}
      <button className="link" disabled={busy} onClick={()=>{setMode(mode==='admin'?'in':'admin');setPassword('');setEmail('');setStatus('')}}>{mode==='admin'?'Back to regular sign-in':'Administrator sign-in'}</button>
      {status&&<p className="auth-status" role="status">{status}</p>}
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
      <div className="onboarding-top"><div className="brand"><span><BeltMark size={26}/></span><div><b>GrappleLog</b><small>{cloud?'Setting up your account':'Local preview setup'}</small></div></div><span>{step+1} / {steps}</span></div>
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
        <button className="primary onboarding-next" disabled={busy} onClick={finish}>{busy?'Saving…':'Enter GrappleLog'}<ArrowRight size={17}/></button>
        <button className="link onboarding-skip" disabled={busy} onClick={()=>{setP({...p,focusPosition:''});finish()}}>Skip for now</button>
      </div>}
    </section>
  </main>
}
