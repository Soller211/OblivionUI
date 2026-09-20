import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'motion/react'
import { App } from './App'
import { ProveedorTema } from '@/components/tema'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <ProveedorTema>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </ProveedorTema>,
)
