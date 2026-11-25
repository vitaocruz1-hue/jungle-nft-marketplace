import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { createQueryClient } from '@/lib/query-client'
import { createAppRouter } from '@/router'

/** Cria o cache, o roteador e desenha o app na página. */
export function renderApp(rootElement: HTMLElement) {
  const queryClient = createQueryClient()
  const router = createAppRouter(queryClient)

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}
