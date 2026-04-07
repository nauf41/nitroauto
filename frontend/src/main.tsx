import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { enableMapSet } from 'immer'
import './styles.css'
import { init as netStateInit } from './states/net.ts'

enableMapSet();
netStateInit();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
