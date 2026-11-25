import type { Cart, CartItem, CartItemIssue } from '@/contracts/cart'
import { CART_ID_HEADER } from '@/contracts/cart'
import { addEth, compareEth, multiplyEth, normalizeEth } from '@/lib/eth'

import { db, type CartRecord } from '../db'

/** Carrinho do usuário logado (cria se não existir). */
export function getUserCart(userId: string): CartRecord {
  let cart = db.state.carts.find((c) => c.userId === userId)
  if (!cart) {
    cart = { id: db.nextId('cart'), userId, lines: [], updatedAt: new Date().toISOString() }
    db.state.carts.push(cart)
  }
  return cart
}

/** Carrinho do visitante pelo cabeçalho X-Cart-Id (cria um novo se não existir). */
export function getGuestCart(request: Request): CartRecord {
  const id = request.headers.get(CART_ID_HEADER)
  let cart = id ? db.state.carts.find((c) => c.id === id && c.userId === null) : undefined
  if (!cart) {
    cart = { id: db.nextId('cart'), userId: null, lines: [], updatedAt: new Date().toISOString() }
    db.state.carts.push(cart)
  }
  return cart
}

/** Limite real de uma edição: o menor entre estoque e limite por pedido. */
export function editionLimit(edition: { available: number; maxPerOrder: number }) {
  return Math.min(edition.available, edition.maxPerOrder)
}

/** Move os itens do visitante para o carrinho da conta (ao entrar ou cadastrar). */
export function mergeGuestCart(request: Request, userId: string) {
  const guestId = request.headers.get(CART_ID_HEADER)
  if (!guestId) return
  const guest = db.state.carts.find((c) => c.id === guestId && c.userId === null)
  if (!guest || guest.lines.length === 0) return
  const target = getUserCart(userId)
  for (const line of guest.lines) {
    const nft = db.findNft(line.nftId)
    const edition = nft?.editions.find((e) => e.id === line.editionId)
    if (!edition) continue
    const existing = target.lines.find((l) => l.editionId === line.editionId)
    const limit = Math.max(editionLimit(edition), 1)
    if (existing) existing.quantity = Math.min(existing.quantity + line.quantity, limit)
    else target.lines.push({ ...line, id: db.nextId('line') })
  }
  target.updatedAt = new Date().toISOString()
  db.state.carts = db.state.carts.filter((c) => c.id !== guest.id)
}

/** Monta a resposta do carrinho com preços e estoque ATUAIS do catálogo. */
export function toCart(cart: CartRecord): Cart {
  const items: CartItem[] = []
  for (const line of cart.lines) {
    const nft = db.findNft(line.nftId)
    const edition = nft?.editions.find((e) => e.id === line.editionId)
    if (!nft || !edition) continue
    const issues: CartItemIssue[] = []
    if (compareEth(edition.price, line.addedUnitPrice) !== 0) issues.push('PRICE_CHANGED')
    if (edition.available === 0) issues.push('OUT_OF_STOCK')
    else if (line.quantity > editionLimit(edition)) issues.push('QUANTITY_UNAVAILABLE')
    items.push({
      id: line.id,
      nftId: nft.id,
      editionId: edition.id,
      editionLabel: edition.label,
      name: nft.name,
      tokenId: nft.tokenId,
      image: nft.image,
      unitPrice: normalizeEth(edition.price),
      addedUnitPrice: normalizeEth(line.addedUnitPrice),
      quantity: line.quantity,
      available: edition.available,
      maxPerOrder: edition.maxPerOrder,
      lineTotal: multiplyEth(edition.price, line.quantity),
      issues,
    })
  }
  return {
    id: cart.id,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: addEth('0', ...items.map((item) => item.lineTotal)),
    updatedAt: cart.updatedAt,
  }
}
