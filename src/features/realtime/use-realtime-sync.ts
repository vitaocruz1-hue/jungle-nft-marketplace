import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/realtime'
import { REALTIME_EVENTS, SOCKET_PATH } from '@/contracts/realtime'
import { useSession, useSessionToken } from '@/features/auth/session'

import { applyNftUpdated, applyOrderUpdated, reconcileAfterReconnect } from './apply-events'
import { createEventFilter } from './event-filter'
import { setConnectionStatus } from './realtime-store'

/**
 * Conexão Socket.IO do app. Uma por sessão: ao entrar, sair ou trocar de
 * usuário, a conexão anterior (e seus listeners) é encerrada e outra é aberta
 * com o token novo — eventos da sessão antiga não alcançam a nova.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient()
  const token = useSessionToken()
  const { user } = useSession()
  const userIdRef = useRef<string | null>(null)
  useEffect(() => {
    userIdRef.current = user?.id ?? null
  }, [user])

  useEffect(() => {
    const socket = io(window.location.origin, {
      path: SOCKET_PATH,
      transports: ['websocket'],
      auth: { token },
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
    })
    const filter = createEventFilter()
    let hasConnectedBefore = false

    setConnectionStatus('connecting')
    socket.on('connect', () => {
      if (hasConnectedBefore) reconcileAfterReconnect(queryClient)
      hasConnectedBefore = true
      setConnectionStatus('connected')
    })
    socket.on('disconnect', () => setConnectionStatus('reconnecting'))

    socket.on(REALTIME_EVENTS.nftUpdated, (event: NftUpdatedEvent) => {
      if (filter.accept(event)) applyNftUpdated(queryClient, event)
    })
    socket.on(REALTIME_EVENTS.orderUpdated, (event: OrderUpdatedEvent) => {
      // Defesa extra: pedido de outro usuário nunca é aplicado.
      if (event.userId !== userIdRef.current) return
      if (filter.accept(event)) applyOrderUpdated(queryClient, event)
    })

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [token, queryClient])
}
