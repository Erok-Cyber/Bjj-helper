import { useState, type FormEvent } from 'react'
import { LockKeyhole } from 'lucide-react'
import { supabase } from './supabase'

export default function AccountSecurity({onChanged}:{onChanged?:()=>void}={}) {
  const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[nonce,setNonce]=useState('')
  const [busy,setBusy]=useState(false),[needsCode,setNeedsCode]=useState(false)
  const [message,setMessage]=useState(''),[success,setSuccess]=useState(false)
  const submit=async(e:FormEvent)=>{
    e.preventDefault()
    if(busy)return
    setSuccess(false);setMessage('')
    if(password.length<8){setMessage('Use at least 8 characters.');return}
    if(password!==confirm){setMessage('The passwords do not match.');return}
    if(needsCode&&!nonce.trim()){setMessage('Enter the verification code from your email.');return}
    setBusy(true)
    try {
      const {error}=await supabase.auth.updateUser({password,...(needsCode?{nonce:nonce.trim()}:{})})
      if(error){
        if(error.code==='reauthentication_needed'||error.code==='reauthentication_not_valid')setNeedsCode(true)
        setMessage(error.message)
      }else{
        setPassword('');setConfirm('');setNonce('');setNeedsCode(false);setSuccess(true)
        setMessage('Your password has been changed.')
        onChanged?.()
      }
    }catch{setMessage('Could not change your password. Please try again.')}
    finally{setBusy(false)}
  }
  const sendCode=async()=>{
    setBusy(true);setSuccess(false)
    try{const {error}=await supabase.auth.reauthenticate();setMessage(error?error.message:'Verification code sent. Check your email.')}
    catch{setMessage('Could not send a code. Please try again.')}
    finally{setBusy(false)}
  }
  return <section className="card account-security">
    <div className="head"><div><small>ACCOUNT SECURITY</small><h3><LockKeyhole size={18}/> Change password</h3></div></div>
    <form onSubmit={submit} className="security-form">
      <p className="muted">Choose a unique password with at least 8 characters.</p>
      <label className="field"><span>New password</span><input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label>
      <label className="field"><span>Confirm new password</span><input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e=>setConfirm(e.target.value)} disabled={busy}/></label>
      {needsCode&&<div className="security-verification"><p>Confirm your identity with a code sent to your account email.</p><button type="button" onClick={sendCode} disabled={busy}>Send verification code</button><label className="field"><span>Email verification code</span><input autoComplete="one-time-code" value={nonce} onChange={e=>setNonce(e.target.value)} disabled={busy}/></label></div>}
      {message&&<p role="status" className={success?'status':'security-message'}>{message}</p>}
      <button type="submit" className="primary" disabled={busy}>{busy?'Updating…':'Update password'}</button>
    </form>
  </section>
}
