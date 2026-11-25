import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import type { Socket } from 'socket.io-client'

import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/realtime'
import { REALTIME_EVENTS, SOCKET_PATH } from '@/contracts/realtime'
import { useSession, useSessionToken } from '@/features/auth/session'
import { whenNetworkReady } from '@/lib/network-ready'

import { applyNftUpdated, applyOrderUpdated, reconcileOnConnect } from './apply-events'
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
    let socket: Socket | undefined
    let cancelled = false
    const filter = createEventFilter()
    setConnectionStatus('connecting')

    // Importado sob demanda, só quando a rede (MSW) estiver pronta: o
    // engine.io-client guarda a referência ao WebSocket ao ser importado.
    void whenNetworkReady()
      .then(() => import('socket.io-client'))
      .then(({ io }) => {
        if (cancelled) return
        socket = io(window.location.origin, {
          path: SOCKET_PATH,
          transports: ['websocket'],
          auth: { token },
          reconnectionDelay: 500,
          reconnectionDelayMax: 3000,
        })
        listen(socket)
      })

    function listen(socket: Socket) {
      socket.on('connect', () => {
        reconcileOnConnect(queryClient)
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
    }

    return () => {
      cancelled = true
      socket?.removeAllListeners()
      socket?.disconnect()
    }
  }, [token, queryClient])
}
