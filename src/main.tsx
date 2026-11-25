import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { env } from '@/config/env'
import { createQueryClient } from '@/lib/query-client'
import { createAppRouter } from '@/router'

import './index.css'

// A API simulada precisa estar ativa ANTES do app fazer a primeira chamada.
// O import dinâmico deixa o MSW em um arquivo separado: se os mocks estiverem
// desligados, ele nem é baixado.
if (env.enableMocks) {
  const { startMockWorker } = await import('@/mocks/browser')
  await startMockWorker()
}

const queryClient = createQueryClient()
const router = createAppRouter(queryClient)

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Elemento #root não encontrado no index.html')

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
