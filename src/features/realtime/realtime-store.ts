import { useSyncExternalStore } from 'react'

import type { NftUpdatedEvent } from '@/contracts/realtime'

/** Estado da conexão em tempo real, para a interface mostrar "reconectando…". */
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting'

let status: ConnectionStatus = 'connecting'
const statusListeners = new Set<() => void>()

export function setConnectionStatus(next: ConnectionStatus) {
  status = next
  statusListeners.forEach((listener) => listener())
}

export function useConnectionStatus() {
  return useSyncExternalStore(
    (listener) => {
      statusListeners.add(listener)
      return () => statusListeners.delete(listener)
    },
    () => status,
  )
}

/** Avisa quem precisa (ex.: o checkout) que um NFT mudou de preço/estoque. */
type NftChangeListener = (event: NftUpdatedEvent) => void
const nftListeners = new Set<NftChangeListener>()

export function onNftChanged(listener: NftChangeListener) {
  nftListeners.add(listener)
  return () => {
    nftListeners.delete(listener)
  }
}

export function notifyNftChanged(event: NftUpdatedEvent) {
  nftListeners.forEach((listener) => listener(event))
}
