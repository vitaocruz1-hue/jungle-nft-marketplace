import { env } from '@/config/env'
import { setNetworkReady } from '@/lib/network-ready'

import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Elemento #root não encontrado no index.html')

// A API simulada inicia em paralelo e o app é desenhado na hora (skeletons).
// As chamadas REST (Axios) e o Socket.IO aguardam `whenNetworkReady()`, que só
// resolve depois de o MSW interceptar fetch e WebSocket: nenhuma escapa do mock.
// O socket.io-client é importado sob demanda pelo app, já depois disso
// (ele guarda a referência ao WebSocket do navegador quando é importado).
// Com os mocks desligados, o MSW nem é baixado.
const mocksReady = env.enableMocks
  ? import('@/mocks/browser').then(({ startMockWorker }) => startMockWorker())
  : Promise.resolve()
setNetworkReady(mocksReady)

const { renderApp } = await import('./app')
renderApp(rootElement)
await mocksReady

// Painel de cenários da demonstração (só existe com os mocks ligados).
if (env.enableMocks) {
  const { mountScenarioPanel } = await import('@/mocks/devtools/mount')
  mountScenarioPanel()
}
