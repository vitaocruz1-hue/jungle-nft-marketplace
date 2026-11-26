import { useEffect, useSyncExternalStore } from 'react'

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

/**
 * NFTs com preço visível agora (cards, detalhe, carrinho). Cada componente
 * montado conta +1; assim o aviso de tempo real só fala do que está na tela.
 */
const onScreen = new Map<string, number>()

export function isNftOnScreen(nftId: string) {
  return onScreen.has(nftId)
}

/** Destaque breve no preço que acabou de mudar. */
export const PRICE_FLASH_MS = 1600
const flashing = new Set<string>()
const flashTimers = new Map<string, ReturnType<typeof setTimeout>>()
const flashListeners = new Set<() => void>()

export function flashPrice(nftId: string) {
  clearTimeout(flashTimers.get(nftId))
  flashing.add(nftId)
  flashListeners.forEach((listener) => listener())
  flashTimers.set(
    nftId,
    setTimeout(() => {
      flashing.delete(nftId)
      flashTimers.delete(nftId)
      flashListeners.forEach((listener) => listener())
    }, PRICE_FLASH_MS),
  )
}

/**
 * Marca o NFT como "na tela" enquanto o componente existir e diz se o preço
 * dele está em destaque (acabou de mudar em tempo real).
 */
export function useLiveNft(nftId: string) {
  useEffect(() => {
    onScreen.set(nftId, (onScreen.get(nftId) ?? 0) + 1)
    return () => {
      const count = (onScreen.get(nftId) ?? 1) - 1
      if (count > 0) onScreen.set(nftId, count)
      else onScreen.delete(nftId)
    }
  }, [nftId])

  return useSyncExternalStore(
    (listener) => {
      flashListeners.add(listener)
      return () => flashListeners.delete(listener)
    },
    () => flashing.has(nftId),
  )
}
