import { useSyncExternalStore } from 'react'

import { getNetworkStatus, subscribeNetworkStatus } from '@/lib/network-ready'

/** Estado da rede para a interface (ex.: aviso quando a API simulada não está ativa). */
export function useNetworkStatus() {
  return useSyncExternalStore(subscribeNetworkStatus, getNetworkStatus)
}
