import { env } from '@/config/env'

import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Elemento #root não encontrado no index.html')

// A API simulada precisa estar ativa ANTES do app carregar: o socket.io-client
// guarda a referência ao WebSocket do navegador quando o módulo é importado, e
// o MSW só consegue interceptá-lo depois de iniciar. Por isso o app inteiro é
// importado dinamicamente, depois dos mocks. Com os mocks desligados, o MSW
// nem é baixado.
if (env.enableMocks) {
  const { startMockWorker } = await import('@/mocks/browser')
  await startMockWorker()
}

const { renderApp } = await import('./app')
renderApp(rootElement)
