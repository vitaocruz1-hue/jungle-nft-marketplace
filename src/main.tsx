import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Button } from '@/components/ui/button'

import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Elemento #root não encontrado no index.html')

createRoot(rootElement).render(
  <StrictMode>
    <main className="grid min-h-dvh place-items-center gap-4 p-8">
      <h1 className="text-3xl font-bold">NFT Marketplace</h1>
      <Button>Tailwind + shadcn/ui funcionando</Button>
    </main>
  </StrictMode>,
)
