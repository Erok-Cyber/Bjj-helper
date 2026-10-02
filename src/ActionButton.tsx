import { useRef, useState, type ButtonHTMLAttributes } from 'react'

/** Keep forms open on failed saves and prevent accidental double submission. */
export default function ActionButton({onClick,children,confirmMessage,...props}:Omit<ButtonHTMLAttributes<HTMLButtonElement>,'onClick'> & {onClick:()=>unknown|Promise<unknown>;confirmMessage?:string}){
  const locked=useRef(false)
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  const run=async()=>{
    if(locked.current)return
    if(confirmMessage&&!window.confirm(confirmMessage))return
    locked.current=true;setBusy(true);setError('')
    try{await onClick()}catch(e){setError(e instanceof Error?e.message:'Could not save. Check your connection and try again.')}
    finally{locked.current=false;setBusy(false)}
  }
  return <><button {...props} type={props.type||'button'} disabled={props.disabled||busy} aria-busy={busy} onClick={()=>void run()}>{busy?'Saving…':children}</button>{error&&<p role="alert" className="action-error">{error}</p>}</>
}
