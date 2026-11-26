import { setupWorker } from 'msw/browser'

import { apiUrl } from './utils/http'
import { mockControls, type MockControls } from './controls'
import { handlers } from './handlers'
import { HEALTH_PATH } from './handlers/health'
import { resumePendingOrders } from './utils/orders'

declare global {
  interface Window {
    /** Controles da simulação (painel de cenários e testes Playwright). */
    __kurioMocks?: MockControls
  }
}

export const worker = setupWorker(...handlers)

/** Trava do recarregamento automático: no máximo 1 por aba, sem loop. */
const RELOAD_GUARD_KEY = 'kurio:msw-reload'
/** Quanto esperar o service worker assumir a aba depois de registrado. */
const CONTROL_TIMEOUT_MS = 2000

/**
 * O MSW não conseguiu controlar a aba. Acontece com recarregamento forçado
 * (Ctrl+Shift+R), com "Bypass for network" no DevTools ou numa atualização do
 * service worker: as chamadas iriam para a hospedagem e voltariam HTML.
 */
export class MockWorkerUnavailableError extends Error {
  constructor() {
    super('A API simulada (MSW) não controla esta aba.')
    this.name = 'MockWorkerUnavailableError'
  }
}

/**
 * Recarrega a página uma única vez (padrão recomendado para hard reload).
 * Se já recarregou nesta aba e o controle não veio, desiste: o app mostra um
 * aviso claro em vez de chamar a API.
 */
function reloadOnceOrGiveUp(): Promise<never> {
  if (sessionStorage.getItem(RELOAD_GUARD_KEY)) {
    return Promise.reject(new MockWorkerUnavailableError())
  }
  sessionStorage.setItem(RELOAD_GUARD_KEY, '1')
  window.location.reload()
  // A página está indo embora: nada mais deve rodar nem chamar a API.
  return new Promise<never>(() => undefined)
}

async function hasMockRegistration() {
  const registrations = await navigator.serviceWorker.getRegistrations()
  return registrations.some((registration) =>
    [registration.active, registration.waiting, registration.installing].some((sw) =>
      sw?.scriptURL.endsWith('/mockServiceWorker.js'),
    ),
  )
}

/** Espera o service worker assumir a aba (no 1º acesso ele assume logo após registrar). */
function waitForController() {
  if (navigator.serviceWorker.controller) return Promise.resolve(true)
  return new Promise<boolean>((resolve) => {
    const timer = window.setTimeout(() => resolve(false), CONTROL_TIMEOUT_MS)
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        window.clearTimeout(timer)
        resolve(true)
      },
      { once: true },
    )
  })
}

/**
 * Prova real de que as chamadas passam pelo MSW: só a API simulada responde
 * este endereço com JSON. Com o service worker ignorado, a hospedagem responde
 * (404 ou o index.html) e a prova falha.
 */
async function mocksAnswer() {
  try {
    const response = await fetch(apiUrl(HEALTH_PATH), { cache: 'no-store' })
    const type = response.headers.get('content-type') ?? ''
    if (!response.ok || !type.includes('application/json')) return false
    const body = (await response.json()) as { mock?: unknown }
    return body.mock === 'kurio'
  } catch {
    return false
  }
}

export async function startMockWorker() {
  if (!('serviceWorker' in navigator)) throw new MockWorkerUnavailableError()

  // Aba aberta sem o service worker, que já está instalado (ex.: Ctrl+Shift+R).
  // O próprio MSW recarregaria a página sem trava (loop infinito se o controle
  // nunca vier); aqui o recarregamento é nosso, com trava.
  if (!navigator.serviceWorker.controller && (await hasMockRegistration())) {
    return reloadOnceOrGiveUp()
  }

  await worker.start({
    // Chamada para /api sem handler é erro de desenvolvimento: avisa alto.
    // Imagens, fontes e arquivos do Vite passam direto, sem aviso.
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith('/api/')) print.error()
    },
  })

  if (!(await waitForController()) || !(await mocksAnswer())) {
    worker.stop()
    return reloadOnceOrGiveUp()
  }

  // Deu certo: libera um novo recarregamento automático no futuro.
  sessionStorage.removeItem(RELOAD_GUARD_KEY)
  window.__kurioMocks = mockControls
  // Pedidos que estavam pendentes antes do F5 voltam a ser processados.
  resumePendingOrders()
}
