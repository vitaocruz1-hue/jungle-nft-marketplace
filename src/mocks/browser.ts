import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export async function startMockWorker() {
  await worker.start({
    // Chamada para /api sem handler é erro de desenvolvimento: avisa alto.
    // Imagens, fontes e arquivos do Vite passam direto, sem aviso.
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api/')) print.error()
    },
  })
}
