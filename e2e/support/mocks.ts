import type { Page } from '@playwright/test'

/** Controles do "servidor" simulado expostos em window.__kurioMocks (src/mocks/controls.ts). */
interface MockControls {
  reset(): void
  expireSession(): void
  ordersCount(): number
  changeNftPrice(nftId: string, newPrice: string): boolean
  sellOut(nftId: string, editionId?: string): boolean
  replayLastEvent(): boolean
  emitStaleNftEvent(nftId: string): boolean
  dropConnections(): void
  connectedClients(): number
}

declare global {
  interface Window {
    __kurioMocks?: MockControls
  }
}

/**
 * Chama os controles do "servidor" simulado. As mudanças chegam à interface
 * pela API REST e pelo Socket.IO, nunca direto nos componentes.
 */
export async function mocks<T>(
  page: Page,
  run: (controls: MockControls) => T,
): Promise<Awaited<T>> {
  await page.waitForFunction(() => window.__kurioMocks !== undefined)
  return page.evaluate(`(${run.toString()})(window.__kurioMocks)`) as Promise<Awaited<T>>
}

/** Ativa um cenário de rede antes de carregar o app. */
export async function useScenario(page: Page, scenario: string) {
  await page.addInitScript((id) => sessionStorage.setItem('kurio:mock-scenario', id), scenario)
}
