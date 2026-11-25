import { delay } from 'msw'

/**
 * Cenários de rede da API simulada, escolhidos pela URL: `?cenario=lento`.
 * A escolha fica salva na aba (sessionStorage) até ser trocada; `?cenario=padrao`
 * volta ao normal. Tudo é determinístico para os testes serem reproduzíveis.
 */

export const SCENARIOS = {
  padrao: 'Rede normal (~250 ms)',
  lento: 'Rede lenta (3 s por resposta)',
  variavel: 'Latência variável: respostas chegam fora de ordem',
} as const

export type ScenarioId = keyof typeof SCENARIOS

const STORAGE_KEY = 'kurio:mock-scenario'

function isScenarioId(value: string | null): value is ScenarioId {
  return value !== null && value in SCENARIOS
}

/** Lê o cenário da URL (e guarda) ou o último escolhido nesta aba. */
export function getActiveScenario(): ScenarioId {
  const fromUrl = new URLSearchParams(window.location.search).get('cenario')
  if (isScenarioId(fromUrl)) {
    sessionStorage.setItem(STORAGE_KEY, fromUrl)
    return fromUrl
  }
  const saved = sessionStorage.getItem(STORAGE_KEY)
  return isScenarioId(saved) ? saved : 'padrao'
}

/** Sequência fixa de atrasos: a 1ª requisição demora mais que a 2ª, etc. */
const VARIABLE_DELAYS_MS = [1200, 300, 800, 150, 1000, 450]
let requestCounter = 0

/** Espera o tempo de rede do cenário ativo antes de responder. */
export async function simulateNetwork() {
  const scenario = getActiveScenario()
  if (scenario === 'lento') return delay(3000)
  if (scenario === 'variavel') {
    const ms = VARIABLE_DELAYS_MS[requestCounter++ % VARIABLE_DELAYS_MS.length] ?? 300
    return delay(ms)
  }
  return delay(250)
}
