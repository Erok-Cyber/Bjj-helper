import { useEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from './supabase'

export type AdminUser={id:string;email:string;createdAt:string|null;lastSignInAt:string|null;confirmed:boolean;banned:boolean;isAdmin:boolean}
type Action='confirm_email'|'send_reset'|'set_password'|'block'|'unblock'
type Props={user:AdminUser;onUpdated:(user:AdminUser)=>void;onDenied:()=>void;onBusyChange:(busy:boolean)=>void;onClose:()=>void}
export default function AdminUserActions({user,onUpdated,onDenied,onBusyChange,onClose}:Props){
  const [action,setAction]=useState<Action>(user.banned?'unblock':!user.confirmed&&user.email?'confirm_email':'send_reset')
  const [password,setPassword]=useState(''),[repeat,setRepeat]=useState(''),[confirmed,setConfirmed]=useState(false)
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
  const mounted=useRef(true)
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
  const choose=(next:Action)=>{setAction(next);setPassword('');setRepeat('');setConfirmed(false);setError('');setMessage('')}
  const submit=async(e:FormEvent)=>{
    e.preventDefault()
    if(busy||!confirmed)return
    setError('');setMessage('')
    if(action==='set_password'){
      if(password.length<8||new TextEncoder().encode(password).length>72){setError('Use 8–72 characters (at most 72 bytes) for the password.');return}
      if(password!==repeat){setError('The passwords do not match.');return}
    }
    setBusy(true);onBusyChange(true)
    try{
      const {data,error:requestError}=await supabase.functions.invoke('admin-users',{body:{action,userId:user.id,confirmed:true,...(action==='set_password'?{password}:{})}})
      if(!mounted.current)return
      if(requestError){
        const response=requestError.context
        if(response instanceof Response&&(response.status===401||response.status===403)){onDenied();return}
        let detail='The change could not be completed. Please try again.'
        if(response instanceof Response){try{const body=await response.clone().json();if(typeof body.error==='string')detail=body.error}catch{ /* Keep the safe fallback. */ }}
        setError(detail);return
      }
      if(!data?.success){setError('The change could not be confirmed. Refresh the account list.');return}
      setPassword('');setRepeat('');setConfirmed(false)
      if(data.user)onUpdated(data.user)
      setMessage(action==='confirm_email'?'Email confirmed. The user can now sign in with their existing password.':action==='send_reset'?`Reset email sent to ${user.email}.`:action==='set_password'?'Password updated.':action==='block'?'Sign-in blocked.':'Sign-in restored.')
      if(action==='confirm_email')setAction('send_reset')
      if(action==='block')setAction('unblock')
      if(action==='unblock')setAction('block')
    }catch{if(mounted.current)setError('Could not connect. Please try again.')}
    finally{if(mounted.current){setBusy(false);onBusyChange(false)}}
  }
  const label=action==='confirm_email'?'Confirm email':action==='send_reset'?'Send reset email':action==='set_password'?'Set new password':action==='block'?'Block sign-in':'Unblock sign-in'
  return <form className="admin-user-actions" aria-label={`Manage ${user.email}`} onSubmit={submit}>
    <div className="admin-action-heading"><h4>Manage user</h4><button type="button" onClick={onClose} disabled={busy}>Close</button></div>
    <label className="field"><span>Action</span><select value={action} disabled={busy} onChange={e=>choose(e.target.value as Action)}>
      <option value="confirm_email" disabled={user.confirmed||!user.email||user.banned}>{user.confirmed?'Email already confirmed':'Confirm email manually'}</option>
      <option value="send_reset" disabled={!user.email||user.banned}>Send password reset email</option>
      <option value="set_password">Set a new password</option>
      <option value={user.banned?'unblock':'block'}>{user.banned?'Unblock sign-in':'Block sign-in'}</option>
    </select></label>
    <p className="muted">{action==='confirm_email'?'Approve this email yourself so the user can sign in without clicking the confirmation email. Only approve accounts you recognize.':action==='send_reset'?'The user receives a link to choose their own password.':action==='set_password'?'Replace the password for this account. Existing passwords cannot be viewed.':action==='block'?'Stops new sign-ins until you unblock the account. Training data is kept. An existing session may keep access until its token expires.':'Allows the user to sign in again. Training data is kept.'}</p>
    {action==='set_password'&&<div className="admin-password-fields">
      <label className="field"><span>New user password</span><input type="password" autoComplete="new-password" required minLength={8} maxLength={72} disabled={busy} value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <label className="field"><span>Confirm user password</span><input type="password" autoComplete="new-password" required minLength={8} maxLength={72} disabled={busy} value={repeat} onChange={e=>setRepeat(e.target.value)}/></label>
    </div>}
    <label className="admin-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} disabled={busy}/><span>Apply this change to <strong>{user.email||user.id}</strong></span></label>
    {error&&<p role="alert" className="security-message">{error}</p>}
    {message&&<p role="status" className="status">{message}</p>}
    <button type="submit" className={action==='block'?'admin-block-button':'primary'} disabled={busy||!confirmed}>{busy?'Saving…':label}</button>
  </form>
}
