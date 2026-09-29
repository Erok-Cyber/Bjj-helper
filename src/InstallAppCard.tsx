import { useEffect, useState } from 'react'
import { Download, Smartphone } from 'lucide-react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted'|'dismissed'; platform: string }>
}

export default function InstallAppCard(){
  const [promptEvent,setPromptEvent]=useState<InstallPromptEvent|null>(null)
  const [installed,setInstalled]=useState(false)
  const [status,setStatus]=useState('')

  useEffect(()=>{
    const standalone=window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone===true
    setInstalled(standalone)

    const onPrompt=(event:Event)=>{
      event.preventDefault()
      setPromptEvent(event as InstallPromptEvent)
    }
    const onInstalled=()=>{setInstalled(true);setPromptEvent(null);setStatus('Installed')}
    window.addEventListener('beforeinstallprompt',onPrompt)
    window.addEventListener('appinstalled',onInstalled)
    return()=>{
      window.removeEventListener('beforeinstallprompt',onPrompt)
      window.removeEventListener('appinstalled',onInstalled)
    }
  },[])

  const install=async()=>{
    if(!promptEvent){
      const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent)
      setStatus(isiOS?'On iPhone/iPad: Share → Add to Home Screen.':'Use your browser menu and choose Install app / Add to home screen.')
      return
    }
    await promptEvent.prompt()
    const choice=await promptEvent.userChoice
    setStatus(choice.outcome==='accepted'?'Installing…':'Install cancelled')
    if(choice.outcome==='accepted')setPromptEvent(null)
  }

  return <section className="card install-app-card">
    <div className="head"><div><small>APP</small><h3>{installed?'BJJ Helper is installed':'Install BJJ Helper'}</h3></div></div>
    <div className="install-app-body">
      <span className="install-app-icon"><Smartphone size={22}/></span>
      <div><p>{installed?'Runs standalone from your home screen. Updates still come from the same web app.':'Add BJJ Helper to your home screen or desktop. Same account, same data and same automatic web updates.'}</p>{status&&<small>{status}</small>}</div>
      {!installed&&<button className="primary" onClick={install}><Download size={15}/>Install</button>}
    </div>
  </section>
}
