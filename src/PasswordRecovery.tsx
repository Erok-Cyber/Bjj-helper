import { useState } from 'react'
import AccountSecurity from './AccountSecurity'
import BeltMark from './BeltMark'
export default function PasswordRecovery({onDone}:{onDone:()=>void}){
  const [done,setDone]=useState(false)
  return <main className="first-run"><section className="auth-panel password-recovery">
    <div className="brand auth-brand"><span><BeltMark size={26}/></span><div><b>GrappleLog</b><small>Account recovery</small></div></div>
    <h1>{done?'Password updated':'Choose a new password'}</h1>
    {done?<><p>Your new password is ready to use.</p><button className="primary wide" onClick={onDone}>Continue to GrappleLog</button></>:<AccountSecurity onChanged={()=>setDone(true)}/>}
  </section></main>
}
