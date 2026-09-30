import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react'
import { supabase } from './supabase'
import AdminUserActions, { type AdminUser } from './AdminUserActions'

type Page={users:AdminUser[];page:number;total:number|null;hasMore:boolean}
const date=(value:string|null)=>value?new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'Never'
export default function AdminPanel({userId,standalone=false}:{userId:string;standalone?:boolean}){
  const [checked,setChecked]=useState(false)
  const [allowed,setAllowed]=useState(false),[open,setOpen]=useState(false),[busy,setBusy]=useState(false)
  const [result,setResult]=useState<Page|null>(null),[error,setError]=useState(''),[query,setQuery]=useState('')
  const [selected,setSelected]=useState<string|null>(null),[managing,setManaging]=useState(false)
  const generation=useRef(0)
  useEffect(()=>{
    let alive=true
    setChecked(false);setAllowed(false);setOpen(false);setResult(null);setSelected(null);setManaging(false)
    void supabase.functions.invoke('admin-users',{body:{action:'access'}}).then(({data,error})=>{
      if(alive){const permitted=!error&&data?.isAdmin===true;setAllowed(permitted);setChecked(true);if(permitted&&standalone){setOpen(true);void load()}}
    }).catch(()=>{if(alive){setAllowed(false);setChecked(true)}})
    return()=>{alive=false;generation.current++}
  },[userId,standalone])
  const close=()=>{generation.current++;setOpen(false);setResult(null);setQuery('');setError('');setBusy(false);setSelected(null);setManaging(false)}
  const load=async(page=1)=>{
    const current=++generation.current
    setBusy(true);setError('');setResult(null);setSelected(null);setManaging(false)
    try{
      const {data,error}=await supabase.functions.invoke('admin-users',{body:{action:'list',page}})
      if(current!==generation.current)return
      if(error||!Array.isArray(data?.users)){setError('Could not load users. Your account must still have administrator access.');return}
      setResult(data as Page)
    }catch{if(current===generation.current)setError('Could not connect. Please try again.')}
    finally{if(current===generation.current)setBusy(false)}
  }
  const accessDenied=()=>{generation.current++;setResult(null);setSelected(null);setManaging(false);setError('Administrator access is unavailable. Sign out and try again.')}
  const userUpdated=(updated:AdminUser)=>setResult(current=>current?{...current,users:current.users.map(u=>u.id===updated.id?updated:u)}:current)
  if(!allowed)return standalone?<section className="card"><p role="status">{checked?'Administrator access is unavailable. Sign out and try again.':'Checking administrator access…'}</p></section>:null
  if(!open)return <section className="card"><div className="head"><div><small>PRIVATE ADMINISTRATION</small><h3>User administration</h3></div></div><p className="muted">View registered accounts and their account status.</p><button onClick={()=>{setOpen(true);void load()}}><ShieldCheck size={17}/>Open administration</button></section>
  const users=result?.users.filter(u=>(u.email+' '+u.id).toLowerCase().includes(query.toLowerCase()))||[]
  return <section className="card admin-panel" aria-label="Private user administration">
    <div className="head"><div><small>ADMINISTRATORS ONLY</small><h3><ShieldCheck size={18}/> User administration</h3></div>{!standalone&&<button onClick={close} disabled={managing}><ArrowLeft size={16}/>Close</button>}</div>
    <p className="muted">Choose a user to confirm their email, manage their password or change sign-in access.</p>
    <div className="admin-toolbar"><label className="field"><span>Search this page</span><input disabled={managing} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Email or user ID"/></label><button disabled={busy||managing} onClick={()=>void load(result?.page||1)}><RefreshCw size={16}/>Refresh</button></div>
    {busy&&<p role="status">Loading users…</p>}
    {error&&<p role="alert">{error}</p>}
    {result&&<><p className="muted">{result.total!==null?`${result.total} registered accounts · `:''}Page {result.page}</p>
      <div className="admin-users">{users.map(u=><article className="admin-user" key={u.id}>
        <div className="admin-user-heading"><strong>{u.email||'No email'}</strong><span className={'pill'+(u.banned?' admin-blocked':'')}>{u.banned?'Blocked':u.isAdmin?'Admin':u.confirmed?'Confirmed':'Unconfirmed'}</span></div>
        <small className="muted">{u.id}</small><dl><div><dt>Registered</dt><dd>{date(u.createdAt)}</dd></div><div><dt>Last sign-in</dt><dd>{date(u.lastSignInAt)}</dd></div></dl>
        {u.isAdmin||u.id===userId?<p className="admin-protected muted">{u.id===userId?'Your admin account · Use Account security.':'Protected administrator account'}</p>:<>
          {selected!==u.id&&<button className="admin-manage-button" disabled={managing} onClick={()=>setSelected(u.id)}>Manage user</button>}
          {selected===u.id&&<AdminUserActions key={u.id} user={u} onUpdated={userUpdated} onDenied={accessDenied} onBusyChange={setManaging} onClose={()=>setSelected(null)}/>}
        </>}
      </article>)}</div>
      {!users.length&&<p>No users match this page.</p>}
      <div className="actions"><button disabled={busy||managing||result.page<=1} onClick={()=>void load(result.page-1)}>Previous</button><button disabled={busy||managing||!result.hasMore} onClick={()=>void load(result.page+1)}>Next</button></div>
    </>}
  </section>
}
