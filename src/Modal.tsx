import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, X } from 'lucide-react'

export function useDialogFocus(close:()=>void){
  const ref=useRef<HTMLElement>(null),closeRef=useRef(close),id=useId()
  closeRef.current=close
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    const original=document.body.style.overflow
    document.body.style.overflow='hidden'
    ref.current?.focus()
    const onKey=(e:KeyboardEvent)=>{
      const dialogs=document.querySelectorAll('[data-dialog-root]')
      if(dialogs[dialogs.length-1]!==ref.current)return
      if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeRef.current();return}
      if(e.key!=='Tab')return
      const focusable=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')||[]).filter(e=>e.getClientRects().length)
      const first=focusable[0],last=focusable[focusable.length-1]
      if(!first){e.preventDefault();return}
      if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===ref.current)){e.preventDefault();first.focus()}
    }
    document.addEventListener('keydown',onKey,true)
    return()=>{document.removeEventListener('keydown',onKey,true);document.body.style.overflow=original;if(previous?.isConnected)previous.focus()}
  },[])
  return {ref,id}
}

export default function Modal({title,close,children}:{title:string;close:()=>void;children:ReactNode}){
  const {ref,id}=useDialogFocus(close)
  return createPortal(<div className="modal-bg" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><section data-dialog-root ref={ref} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} className="modal">
    <div className="modal-head"><button type="button" className="icon modal-back" onClick={close} aria-label="Back"><ArrowLeft size={18}/></button><h3 id={id}>{title}</h3><button type="button" className="icon" onClick={close} aria-label="Close"><X size={18}/></button></div>
    {children}
  </section></div>,document.body)
}
