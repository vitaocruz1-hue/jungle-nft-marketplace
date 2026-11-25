import type { Order } from '@/contracts/orders'

import { db, type OrderRecord } from '../db'
import { commitNftChange, emitOrderUpdated } from '../realtime'
import { getUserCart } from './cart'

/** Tempo que a "rede" leva para confirmar/recusar um pedido. */
export const SETTLEMENT_DELAY_MS = 2500

const EXPLORERS = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  solana: 'https://solscan.io/tx/',
} as const

const timers = new Map<string, ReturnType<typeof setTimeout>>()

export function toOrder(record: OrderRecord): Order {
  const {
    userId: _userId,
    idempotencyKey: _key,
    requestHash: _hash,
    settleAt: _settleAt,
    outcome: _outcome,
    ...order
  } = record
  return order
}

function randomHex(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(length / 2)))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

/** Devolve ao estoque as unidades reservadas (pedido recusado). */
function releaseStock(order: OrderRecord) {
  for (const item of order.items) {
    const nft = db.findNft(item.nftId)
    const edition = nft?.editions.find((e) => e.id === item.editionId)
    if (!nft || !edition) continue
    edition.available += item.quantity
    commitNftChange(nft)
  }
}

/** Remove do carrinho SÓ os itens e quantidades comprados. */
function removePurchasedFromCart(order: OrderRecord) {
  const cart = getUserCart(order.userId)
  for (const item of order.items) {
    const line = cart.lines.find((l) => l.editionId === item.editionId)
    if (!line) continue
    line.quantity -= item.quantity
  }
  cart.lines = cart.lines.filter((l) => l.quantity > 0)
  if (cart.lines.length === 0) cart.couponCode = null
  cart.updatedAt = new Date().toISOString()
}

/** Decide o resultado do pedido. Pedidos confirmados/recusados são finais. */
export function settleOrder(order: OrderRecord) {
  timers.delete(order.id)
  if (order.status !== 'pending') return
  if (order.outcome === 'confirmed') {
    const hash = `0x${randomHex(64)}`
    order.status = 'confirmed'
    order.transaction = { hash, explorerUrl: `${EXPLORERS[order.network]}${hash}` }
    removePurchasedFromCart(order)
  } else {
    order.status = 'declined'
    order.failureReason = 'A carteira recusou o pagamento. Nenhum valor foi cobrado.'
    releaseStock(order)
  }
  order.version += 1
  order.updatedAt = new Date().toISOString()
  db.persist()
  emitOrderUpdated(order)
}

export function scheduleSettlement(order: OrderRecord) {
  if (order.status !== 'pending' || timers.has(order.id)) return
  const wait = Math.max(0, new Date(order.settleAt).getTime() - Date.now())
  timers.set(
    order.id,
    setTimeout(() => {
      const current = db.state.orders.find((o) => o.id === order.id)
      if (current) settleOrder(current)
    }, wait),
  )
}

/** Após F5 o mock recomeça: retoma os pedidos que estavam pendentes. */
export function resumePendingOrders() {
  for (const order of db.state.orders) if (order.status === 'pending') scheduleSettlement(order)
}

/** Assinatura simples do corpo da requisição (para a idempotência). */
export function hashRequest(body: unknown) {
  const text = JSON.stringify(body)
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0
  return String(hash)
}
