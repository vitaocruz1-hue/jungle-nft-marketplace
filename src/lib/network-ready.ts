/**
 * Promessa resolvida quando a rede do app está pronta para uso.
 * Com a API simulada ligada, só resolve depois de o MSW interceptar fetch e
 * WebSocket: a interface aparece na hora, mas nenhuma chamada escapa do mock.
 */
let ready: Promise<void> = Promise.resolve()

export function setNetworkReady(promise: Promise<void>) {
  ready = promise
}

export function whenNetworkReady() {
  return ready
}
