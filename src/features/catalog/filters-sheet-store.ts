import { useSyncExternalStore } from 'react'

/**
 * Estado da gaveta de filtros do catálogo. Fica fora do componente porque
 * no celular quem abre a gaveta é o botão ao lado da busca, no topo da Início.
 */
let open = false
const listeners = new Set<() => void>()

export function setFiltersSheetOpen(next: boolean) {
  open = next
  listeners.forEach((listener) => listener())
}

export function useFiltersSheetOpen() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => open,
  )
}
