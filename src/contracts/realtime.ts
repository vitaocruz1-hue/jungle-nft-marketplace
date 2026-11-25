import type { NftEdition } from './catalog'
import type { EthAmount, IsoDateTime } from './common'
import type { OrderStatus } from './orders'

/**
 * Eventos Socket.IO. Todo evento tem identidade estável (eventId), recurso
 * afetado e versão: o cliente ignora duplicatas e versões antigas.
 */
interface RealtimeEventBase {
  eventId: string
  /** Versão do recurso após a mudança. */
  version: number
  occurredAt: IsoDateTime
}

export interface NftUpdatedEvent extends RealtimeEventBase {
  type: 'nft.updated'
  resource: { type: 'nft'; id: string }
  data: {
    price: EthAmount
    compareAtPrice: EthAmount | null
    soldOut: boolean
    editions: Pick<NftEdition, 'id' | 'price' | 'available'>[]
  }
}

export interface OrderUpdatedEvent extends RealtimeEventBase {
  type: 'order.updated'
  resource: { type: 'order'; id: string }
  /** Dono do pedido: eventos de outro usuário são descartados pelo cliente. */
  userId: string
  data: { status: OrderStatus; failureReason: string | null }
}

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent

export const REALTIME_EVENTS = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
} as const

/**
 * Caminho do Socket.IO (mesma origem do app). Não usamos o padrão "/socket.io"
 * porque o MSW reescreve esse caminho ao casar a URL do WebSocket.
 */
export const SOCKET_PATH = '/realtime'
