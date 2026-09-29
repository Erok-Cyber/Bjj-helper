import { useState } from 'react'
import { LogOut, ShieldCheck } from 'lucide-react'
import { supabase } from './supabase'
import BeltMark from './BeltMark'
import AdminPanel from './AdminPanel'
import AccountSecurity from './AccountSecurity'
export default function AdminHome({userId}:{userId:string}){
  const [error,setError]=useState(''),[busy,setBusy]=useState(false)
  const signOut=async()=>{
    setBusy(true);setError('')
    try{const {error}=await supabase.auth.signOut();if(error)setError('Could not sign out. Please try again.')}
    catch{setError('Could not sign out. Please try again.')}
    finally{setBusy(false)}
  }
  return <main className="page stack admin-home">
    <header className="admin-home-header"><div className="brand"><span><BeltMark size={26}/></span><div><b>GrappleLog</b><small>Administration</small></div></div><button disabled={busy} onClick={signOut}><LogOut size={16}/>Sign out</button></header>
    <section className="title"><div><small>PRIVATE ADMINISTRATION</small><h2><ShieldCheck size={25}/> Admin dashboard</h2><p>Manage registered users and account security.</p></div></section>
    {error&&<p role="alert">{error}</p>}
    <AdminPanel userId={userId} standalone/>
    <details className="admin-security"><summary>Account security</summary><AccountSecurity/></details>
  </main>
}
