import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'

import type {
  AddCartItemRequest,
  ApplyCouponRequest,
  Cart,
  UpdateCartItemRequest,
} from '@/contracts/cart'
import type { ApiErrorBody } from '@/contracts/common'

import { db, type CartRecord } from '../db'
import { simulateNetwork } from '../scenarios'
import { authenticate } from '../utils/auth'
import { editionLimit, getGuestCart, getUserCart, toCart } from '../utils/cart'
import { apiUrl, errorResponse, readJson } from '../utils/http'
import { checkCoupon } from '../utils/pricing'

type CartResolution =
  { ok: true; cart: CartRecord } | { ok: false; response: ReturnType<typeof errorResponse> }

/** Logado → carrinho da conta; visitante → carrinho do X-Cart-Id. Token vencido → 401. */
function resolveCart(request: Request): CartResolution {
  const auth = authenticate(request)
  if (auth && !auth.ok) return { ok: false, response: auth.response }
  return { ok: true, cart: auth ? getUserCart(auth.user.id) : getGuestCart(request) }
}

function saveAndRespond(cart: CartRecord, status = 200) {
  cart.updatedAt = new Date().toISOString()
  db.persist()
  return HttpResponse.json<Cart>(toCart(cart), { status })
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1
}

export const cartHandlers = [
  http.get<PathParams, DefaultBodyType, Cart | ApiErrorBody>(
    apiUrl('/cart'),
    async ({ request }) => {
      await simulateNetwork()
      const resolved = resolveCart(request)
      if (!resolved.ok) return resolved.response
      db.persist()
      return HttpResponse.json(toCart(resolved.cart))
    },
  ),

  http.post<PathParams, DefaultBodyType, Cart | ApiErrorBody>(
    apiUrl('/cart/items'),
    async ({ request }) => {
      await simulateNetwork()
      const resolved = resolveCart(request)
      if (!resolved.ok) return resolved.response
      const body = await readJson<AddCartItemRequest>(request)
      if (!body || !isPositiveInt(body.quantity)) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Quantidade inválida.', {
          quantity: 'Informe uma quantidade inteira maior que zero.',
        })
      }
      const nft = db.findNft(String(body.nftId))
      const edition = nft?.editions.find((e) => e.id === body.editionId)
      if (!nft || !edition) return errorResponse(404, 'NOT_FOUND', 'NFT ou edição não encontrado.')
      if (edition.available === 0) {
        return errorResponse(409, 'OUT_OF_STOCK', `A edição ${edition.label} está esgotada.`)
      }

      const { cart } = resolved
      const existing = cart.lines.find((line) => line.editionId === edition.id)
      const total = (existing?.quantity ?? 0) + body.quantity
      const limit = editionLimit(edition)
      if (total > limit) {
        const reason =
          edition.available < edition.maxPerOrder
            ? `Só restam ${edition.available} unidade(s) da edição ${edition.label}.`
            : `Limite de ${edition.maxPerOrder} unidade(s) por pedido na edição ${edition.label}.`
        return errorResponse(
          422,
          'VALIDATION_ERROR',
          existing ? `${reason} Você já tem ${existing.quantity} no carrinho.` : reason,
          { quantity: reason },
        )
      }
      if (existing) existing.quantity = total
      else
        cart.lines.push({
          id: db.nextId('line'),
          nftId: nft.id,
          editionId: edition.id,
          quantity: body.quantity,
          addedUnitPrice: edition.price,
        })
      return saveAndRespond(cart, 201)
    },
  ),

  http.patch<{ itemId: string }, DefaultBodyType, Cart | ApiErrorBody>(
    apiUrl('/cart/items/:itemId'),
    async ({ request, params }) => {
      await simulateNetwork()
      const resolved = resolveCart(request)
      if (!resolved.ok) return resolved.response
      const line = resolved.cart.lines.find((l) => l.id === params.itemId)
      if (!line) return errorResponse(404, 'NOT_FOUND', 'Item não está mais no carrinho.')
      const body = await readJson<UpdateCartItemRequest>(request)
      if (!body || !isPositiveInt(body.quantity)) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Quantidade inválida.', {
          quantity: 'Informe uma quantidade inteira maior que zero.',
        })
      }
      const edition = db.findNft(line.nftId)?.editions.find((e) => e.id === line.editionId)
      if (!edition) return errorResponse(404, 'NOT_FOUND', 'Edição não encontrada.')
      const limit = editionLimit(edition)
      if (body.quantity > limit) {
        return errorResponse(
          422,
          'VALIDATION_ERROR',
          limit === 0
            ? `A edição ${edition.label} está esgotada.`
            : `Máximo de ${limit} unidade(s) para a edição ${edition.label}.`,
          { quantity: `Máximo: ${limit}` },
        )
      }
      line.quantity = body.quantity
      return saveAndRespond(resolved.cart)
    },
  ),

  http.delete<{ itemId: string }, DefaultBodyType, Cart | ApiErrorBody>(
    apiUrl('/cart/items/:itemId'),
    async ({ request, params }) => {
      await simulateNetwork()
      const resolved = resolveCart(request)
      if (!resolved.ok) return resolved.response
      resolved.cart.lines = resolved.cart.lines.filter((l) => l.id !== params.itemId)
      return saveAndRespond(resolved.cart)
    },
  ),

  /** O usuário viu os novos preços: passam a ser a referência do item. */
  http.post<PathParams, DefaultBodyType, Cart | ApiErrorBody>(
    apiUrl('/cart/acknowledge'),
    async ({ request }) => {
      await simulateNetwork()
      const resolved = resolveCart(request)
      if (!resolved.ok) return resolved.response
      for (const line of resolved.cart.lines) {
        const edition = db.findNft(line.nftId)?.editions.find((e) => e.id === line.editionId)
        if (edition) line.addedUnitPrice = edition.price
      }
      return saveAndRespond(resolved.cart)
    },
  ),

  http.put<PathParams, DefaultBodyType, Cart | ApiErrorBody>(
    apiUrl('/cart/coupon'),
    async ({ request }) => {
      await simulateNetwork()
      const resolved = resolveCart(request)
      if (!resolved.ok) return resolved.response
      const body = await readJson<ApplyCouponRequest>(request)
      const code = String(body?.code ?? '').trim()
      if (!code) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Informe o código.', {
          code: 'Informe o código promocional.',
        })
      }
      const check = checkCoupon(code)
      if (!check.ok) return errorResponse(422, check.code, check.message, { code: check.message })
      resolved.cart.couponCode = check.coupon.code
      return saveAndRespond(resolved.cart)
    },
  ),

  http.delete<PathParams, DefaultBodyType, Cart | ApiErrorBody>(
    apiUrl('/cart/coupon'),
    async ({ request }) => {
      await simulateNetwork()
      const resolved = resolveCart(request)
      if (!resolved.ok) return resolved.response
      resolved.cart.couponCode = null
      return saveAndRespond(resolved.cart)
    },
  ),
]
