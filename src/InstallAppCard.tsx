import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Download, MoreVertical, Share2, Smartphone } from 'lucide-react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted'|'dismissed'; platform: string }>
}

type Platform='ios'|'android'|'other'

export default function InstallAppCard(){
  const [promptEvent,setPromptEvent]=useState<InstallPromptEvent|null>(null)
  const [installed,setInstalled]=useState(false)
  const [showGuide,setShowGuide]=useState(false)
  const [status,setStatus]=useState('')

  const platform=useMemo<Platform>(()=>{
    const ua=navigator.userAgent.toLowerCase()
    if(/iphone|ipad|ipod/.test(ua))return 'ios'
    if(/android/.test(ua))return 'android'
    return 'other'
  },[])

  useEffect(()=>{
    const standalone=window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone===true
    setInstalled(standalone)

    const onPrompt=(event:Event)=>{
      event.preventDefault()
      setPromptEvent(event as InstallPromptEvent)
    }
    const onInstalled=()=>{
      setInstalled(true)
      setPromptEvent(null)
      setShowGuide(false)
      setStatus('Installed')
    }

    window.addEventListener('beforeinstallprompt',onPrompt)
    window.addEventListener('appinstalled',onInstalled)
    return()=>{
      window.removeEventListener('beforeinstallprompt',onPrompt)
      window.removeEventListener('appinstalled',onInstalled)
    }
  },[])

  const install=async()=>{
    if(installed)return

    if(platform==='ios'){
      setShowGuide(true)
      setStatus('')
      return
    }

    if(promptEvent){
      await promptEvent.prompt()
      const choice=await promptEvent.userChoice
      if(choice.outcome==='accepted'){
        setStatus('Installing…')
        setPromptEvent(null)
      }else{
        setStatus('Install cancelled')
      }
      return
    }

    setShowGuide(true)
    setStatus('')
  }

  const title=installed
    ?'BJJ Helper is installed'
    :platform==='ios'
      ?'Install on iPhone'
      :platform==='android'
        ?'Install on Android'
        :'Install BJJ Helper'

  return <section className="card install-app-card">
    <div className="head">
      <div><small>APP</small><h3>{title}</h3></div>
      {installed&&<span className="install-ready"><CheckCircle2 size={14}/>Ready</span>}
    </div>

    <div className="install-app-body">
      <span className="install-app-icon"><Smartphone size={22}/></span>
      <div>
        <p>
          {installed
            ?'Opens like a normal app from your home screen. Updates still come from BJJ Helper automatically.'
            :platform==='ios'
              ?'Adds BJJ Helper to your iPhone home screen with its own icon and standalone app view.'
              :platform==='android'
                ?'Installs BJJ Helper on your home screen/app drawer without Google Play.'
                :'Install the web app on this device. Same account and synced training data.'}
        </p>
        {status&&<small>{status}</small>}
      </div>
      {!installed&&<button className="primary" onClick={install}><Download size={15}/>{platform==='ios'?'How to install':'Install app'}</button>}
    </div>

    {!installed&&showGuide&&platform==='ios'&&<div className="install-guide">
      <b>iPhone</b>
      <ol>
        <li><span><Share2 size={16}/></span><div><strong>Open BJJ Helper in Safari</strong><small>Use this same website.</small></div></li>
        <li><span><Share2 size={16}/></span><div><strong>Tap the Share button</strong><small>The square with the arrow pointing up.</small></div></li>
        <li><span>＋</span><div><strong>Choose “Add to Home Screen”</strong><small>Then tap Add.</small></div></li>
      </ol>
      <p>After that, launch BJJ Helper from the new icon on your home screen. You may need to sign in once in the installed app.</p>
    </div>}

    {!installed&&showGuide&&platform==='android'&&<div className="install-guide">
      <b>Android</b>
      <ol>
        <li><span><MoreVertical size={16}/></span><div><strong>Open the browser menu</strong><small>Usually the three dots in Chrome.</small></div></li>
        <li><span><Download size={16}/></span><div><strong>Choose “Install app”</strong><small>It may also say “Add to Home screen”.</small></div></li>
        <li><span>✓</span><div><strong>Confirm Install</strong><small>BJJ Helper will appear like your other apps.</small></div></li>
      </ol>
    </div>}

    {!installed&&showGuide&&platform==='other'&&<div className="install-guide">
      <b>Install</b>
      <p>Open your browser menu and choose <strong>Install app</strong> or <strong>Add to home screen</strong>.</p>
    </div>}
  </section>
}
