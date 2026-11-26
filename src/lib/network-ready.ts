/**
 * Estado da rede do app (sem dependências: é carregado antes de tudo).
 * Com a API simulada ligada, as chamadas só saem depois de o MSW interceptar
 * fetch e WebSocket: a interface aparece na hora, mas nada escapa do mock.
 * Se o MSW não conseguir controlar a aba (ex.: recarregamento forçado que
 * ignora o service worker), o estado vira "unavailable" e `whenNetworkReady()`
 * rejeita: as chamadas falham na hora, em vez de irem para a hospedagem e
 * voltarem HTML.
 */
export type NetworkStatus = 'starting' | 'ready' | 'unavailable'

let status: NetworkStatus = 'starting'
let ready: Promise<void> = Promise.resolve()
const listeners = new Set<() => void>()

function setStatus(next: NetworkStatus) {
  status = next
  for (const listener of listeners) listener()
}

export function setNetworkReady(promise: Promise<void>) {
  ready = promise.then(
    () => setStatus('ready'),
    (cause: unknown) => {
      setStatus('unavailable')
      throw cause
    },
  )
  // Quem precisa da rede trata a falha; aqui só evita o aviso de "rejeição sem tratamento".
  ready.catch(() => undefined)
}

export function whenNetworkReady() {
  return ready
}

/** A rede caiu de vez (ex.: a recuperação do MSW falhou): as próximas chamadas falham na hora. */
export function markNetworkUnavailable() {
  setNetworkReady(Promise.reject(new Error('API simulada indisponível')))
}

let recovery: (() => Promise<boolean>) | null = null

/**
 * Registra como recuperar a rede quando uma resposta não veio da API simulada
 * (ex.: o service worker foi reiniciado ou atualizado e "esqueceu" a aba).
 */
export function setNetworkRecovery(recover: () => Promise<boolean>) {
  recovery = recover
}

export function getNetworkRecovery() {
  return recovery
}

export function getNetworkStatus() {
  return status
}

export function subscribeNetworkStatus(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
