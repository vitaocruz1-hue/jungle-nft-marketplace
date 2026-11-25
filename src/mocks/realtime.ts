import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'

import type { NftUpdatedEvent, OrderUpdatedEvent, RealtimeEvent } from '@/contracts/realtime'
import { REALTIME_EVENTS, SOCKET_PATH } from '@/contracts/realtime'

import { db, type OrderRecord } from './db'
import type { NftRecord } from './db/fixtures/nfts'
import { getActiveScenario } from './scenarios'
import { currentPrice } from './utils/nft'

/**
 * "Servidor" Socket.IO simulado pelo MSW (via @mswjs/socket.io-binding).
 * O app usa o socket.io-client normalmente; aqui interceptamos a conexão
 * WebSocket e emitimos os eventos com o protocolo do Socket.IO.
 *
 * Limitações da ponte (documentadas no ARCHITECTURE.md): só transporte
 * WebSocket, sem salas/namespaces e sem pings automáticos (enviamos aqui).
 */

const socketLink = ws.link(new RegExp(`${SOCKET_PATH}/`))

interface ClientConnection {
  io: ReturnType<typeof toSocketIo>
  token: string | null
  close: () => void
}

const clients = new Set<ClientConnection>()
let lastEvent: { name: string; event: RealtimeEvent } | null = null

/** Usuário dono do token (se a sessão ainda for válida). */
function userIdFor(token: string | null) {
  if (!token) return null
  const session = db.state.sessions.find((s) => s.token === token)
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null
  return session.userId
}

export const realtimeHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    // Cenário "sem conexão": recusa o socket também.
    if (getActiveScenario() === 'offline') {
      connection.client.close(1013, 'Servidor indisponível')
      return
    }

    const io = toSocketIo(connection)
    const client: ClientConnection = {
      io,
      token: null,
      close: () => connection.client.close(4000, 'Conexão encerrada pela simulação'),
    }
    clients.add(client)

    // O pacote CONNECT do Socket.IO ("40{...}") traz o `auth` enviado pelo cliente.
    connection.client.addEventListener('message', (event) => {
      if (typeof event.data === 'string' && event.data.startsWith('40')) {
        try {
          const auth = JSON.parse(event.data.slice(2) || '{}') as { token?: string }
          client.token = auth.token ?? null
        } catch {
          client.token = null
        }
      }
    })

    // Engine.IO exige "ping" periódico; sem ele o cliente desconecta.
    const ping = setInterval(() => connection.client.send('2'), 20_000)
    connection.client.addEventListener('close', () => {
      clearInterval(ping)
      clients.delete(client)
    })
  }),
]

function nextEventId() {
  return db.nextId('evt')
}

/** Salva a mudança de um NFT, aumenta a versão e avisa todos os clientes. */
export function commitNftChange(nft: NftRecord) {
  nft.version += 1
  const event: NftUpdatedEvent = {
    type: 'nft.updated',
    eventId: nextEventId(),
    version: nft.version,
    occurredAt: new Date().toISOString(),
    resource: { type: 'nft', id: nft.id },
    data: {
      price: currentPrice(nft),
      compareAtPrice: nft.compareAtPrice,
      soldOut: nft.editions.every((e) => e.available === 0),
      editions: nft.editions.map(({ id, price, available }) => ({ id, price, available })),
    },
  }
  db.persist()
  send(REALTIME_EVENTS.nftUpdated, event, () => true)
}

/** Avisa SÓ o dono do pedido sobre a mudança de estado. */
export function emitOrderUpdated(order: OrderRecord) {
  const event: OrderUpdatedEvent = {
    type: 'order.updated',
    eventId: nextEventId(),
    version: order.version,
    occurredAt: new Date().toISOString(),
    resource: { type: 'order', id: order.id },
    userId: order.userId,
    data: { status: order.status, failureReason: order.failureReason },
  }
  db.persist()
  send(REALTIME_EVENTS.orderUpdated, event, (client) => userIdFor(client.token) === order.userId)
}

function send(name: string, event: RealtimeEvent, filter: (client: ClientConnection) => boolean) {
  lastEvent = { name, event }
  for (const client of clients) {
    if (filter(client)) client.io.client.emit(name, event)
  }
}

/* ---------- Controles para o painel de cenários e para os testes ---------- */

/** Reenvia o último evento (testa tolerância a duplicatas). */
export function replayLastEvent() {
  if (!lastEvent) return false
  for (const client of clients) client.io.client.emit(lastEvent.name, lastEvent.event)
  return true
}

/** Envia uma versão ANTIGA de um NFT (o cliente deve ignorar). */
export function emitStaleNftEvent(nftId: string) {
  const nft = db.findNft(nftId)
  if (!nft) return false
  const event: NftUpdatedEvent = {
    type: 'nft.updated',
    eventId: nextEventId(),
    version: Math.max(nft.version - 1, 0),
    occurredAt: new Date(Date.now() - 60_000).toISOString(),
    resource: { type: 'nft', id: nft.id },
    data: {
      price: '999.00',
      compareAtPrice: null,
      soldOut: true,
      editions: nft.editions.map(({ id }) => ({ id, price: '999.00', available: 0 })),
    },
  }
  for (const client of clients) client.io.client.emit(REALTIME_EVENTS.nftUpdated, event)
  return true
}

/** Derruba todas as conexões (o cliente reconecta sozinho). */
export function dropConnections() {
  for (const client of clients) client.close()
}

export function connectedClients() {
  return clients.size
}
