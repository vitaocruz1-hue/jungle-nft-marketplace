import { setupWorker } from 'msw/browser'

import { mockControls, type MockControls } from './controls'
import { handlers } from './handlers'
import { resumePendingOrders } from './utils/orders'

declare global {
  interface Window {
    /** Controles da simulação (painel de cenários e testes Playwright). */
    __kurioMocks?: MockControls
  }
}

export const worker = setupWorker(...handlers)

export async function startMockWorker() {
  await worker.start({
    // Chamada para /api sem handler é erro de desenvolvimento: avisa alto.
    // Imagens, fontes e arquivos do Vite passam direto, sem aviso.
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api/')) print.error()
    },
  })
  window.__kurioMocks = mockControls
  // Pedidos que estavam pendentes antes do F5 voltam a ser processados.
  resumePendingOrders()
}
