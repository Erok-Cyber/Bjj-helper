import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react'
import { supabase } from './supabase'

type AdminUser={id:string;email:string;createdAt:string|null;lastSignInAt:string|null;confirmed:boolean;banned:boolean;isAdmin:boolean}
type Page={users:AdminUser[];page:number;total:number|null;hasMore:boolean}
const date=(value:string|null)=>value?new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'Never'
export default function AdminPanel({userId}:{userId:string}){
  const [allowed,setAllowed]=useState(false),[open,setOpen]=useState(false),[busy,setBusy]=useState(false)
  const [result,setResult]=useState<Page|null>(null),[error,setError]=useState(''),[query,setQuery]=useState('')
  const generation=useRef(0)
  useEffect(()=>{
    let alive=true
    setAllowed(false);setOpen(false);setResult(null)
    void supabase.functions.invoke('admin-users',{body:{action:'access'}}).then(({data,error})=>{
      if(alive)setAllowed(!error&&data?.isAdmin===true)
    }).catch(()=>{if(alive)setAllowed(false)})
    return()=>{alive=false;generation.current++}
  },[userId])
  const close=()=>{generation.current++;setOpen(false);setResult(null);setQuery('');setError('');setBusy(false)}
  const load=async(page=1)=>{
    const current=++generation.current
    setBusy(true);setError('');setResult(null)
    try{
      const {data,error}=await supabase.functions.invoke('admin-users',{body:{action:'list',page}})
      if(current!==generation.current)return
      if(error||!Array.isArray(data?.users)){setError('Could not load users. Your account must still have administrator access.');return}
      setResult(data as Page)
    }catch{if(current===generation.current)setError('Could not connect. Please try again.')}
    finally{if(current===generation.current)setBusy(false)}
  }
  if(!allowed)return null
  if(!open)return <section className="card"><div className="head"><div><small>PRIVATE ADMINISTRATION</small><h3>User administration</h3></div></div><p className="muted">View registered accounts and their account status.</p><button onClick={()=>{setOpen(true);void load()}}><ShieldCheck size={17}/>Open administration</button></section>
  const users=result?.users.filter(u=>(u.email+' '+u.id).toLowerCase().includes(query.toLowerCase()))||[]
  return <section className="card admin-panel" aria-label="Private user administration">
    <div className="head"><div><small>ADMINISTRATORS ONLY</small><h3><ShieldCheck size={18}/> User administration</h3></div><button onClick={close}><ArrowLeft size={16}/>Close</button></div>
    <p className="muted">Account overview. Access is checked on the server every time you load users.</p>
    <div className="admin-toolbar"><label className="field"><span>Search this page</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Email or user ID"/></label><button disabled={busy} onClick={()=>void load(result?.page||1)}><RefreshCw size={16}/>Refresh</button></div>
    {busy&&<p role="status">Loading users…</p>}
    {error&&<p role="alert">{error}</p>}
    {result&&<><p className="muted">{result.total!==null?`${result.total} registered accounts · `:''}Page {result.page}</p>
      <div className="admin-users">{users.map(u=><article className="admin-user" key={u.id}>
        <div className="admin-user-heading"><strong>{u.email||'No email'}</strong><span className="pill">{u.isAdmin?'Admin':u.banned?'Blocked':u.confirmed?'Confirmed':'Unconfirmed'}</span></div>
        <small className="muted">{u.id}</small><dl><div><dt>Registered</dt><dd>{date(u.createdAt)}</dd></div><div><dt>Last sign-in</dt><dd>{date(u.lastSignInAt)}</dd></div></dl>
      </article>)}</div>
      {!users.length&&<p>No users match this page.</p>}
      <div className="actions"><button disabled={busy||result.page<=1} onClick={()=>void load(result.page-1)}>Previous</button><button disabled={busy||!result.hasMore} onClick={()=>void load(result.page+1)}>Next</button></div>
    </>}
  </section>
}
