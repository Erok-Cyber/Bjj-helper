import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@xyflow/react/dist/style.css'
import './styles.css'
import App from './App'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => undefined))
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
