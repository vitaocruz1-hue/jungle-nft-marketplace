import { delay, http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'

import { NETWORK_IDS, type NetworkId } from '@/contracts/catalog'
import type { ApiErrorBody } from '@/contracts/common'
import type { CreateOrderRequest, CreateQuoteRequest, Order, Quote } from '@/contracts/orders'
import { IDEMPOTENCY_HEADER } from '@/contracts/orders'
import { EMAIL_PATTERN } from '@/contracts/auth'
import { compareEth } from '@/lib/eth'

import { db, type OrderRecord } from '../db'
import { commitNftChange } from '../realtime'
import { getActiveScenario, simulateNetwork } from '../scenarios'
import { requireAuth } from '../utils/auth'
import { getUserCart, toCart } from '../utils/cart'
import { apiUrl, errorResponse, readJson } from '../utils/http'
import { hashRequest, scheduleSettlement, SETTLEMENT_DELAY_MS, toOrder } from '../utils/orders'
import { checkCoupon, computeTotals } from '../utils/pricing'

const QUOTE_TTL_MS = 5 * 60 * 1000
/** Respostas de pedido já "atrasadas" no cenário de timeout (só a 1ª tentativa demora). */
const delayedKeys = new Set<string>()

export const ordersHandlers = [
  http.post<PathParams, DefaultBodyType, Quote | ApiErrorBody>(
    apiUrl('/quote'),
    async ({ request }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      const body = await readJson<CreateQuoteRequest>(request)
      const network = body?.network as NetworkId | undefined
      if (!network || !NETWORK_IDS.includes(network)) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Selecione uma rede.', {
          network: 'Selecione uma rede.',
        })
      }

      const cartRecord = getUserCart(auth.user.id)
      const cart = toCart(cartRecord)
      if (cart.items.length === 0) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Seu carrinho está vazio.')
      }
      const blocked = cart.items.find(
        (i) => i.issues.includes('OUT_OF_STOCK') || i.issues.includes('QUANTITY_UNAVAILABLE'),
      )
      if (blocked) {
        return errorResponse(
          409,
          'OUT_OF_STOCK',
          `${blocked.name} (edição ${blocked.editionLabel}) não tem estoque suficiente.`,
        )
      }

      // A cotação usa os preços ATUAIS: ao revisar, o usuário aceita esses valores.
      for (const line of cartRecord.lines) {
        const edition = db.findNft(line.nftId)?.editions.find((e) => e.id === line.editionId)
        if (edition) line.addedUnitPrice = edition.price
      }

      const quote = {
        id: db.nextId('quote'),
        userId: auth.user.id,
        network,
        items: cart.items.map((item) => ({
          nftId: item.nftId,
          editionId: item.editionId,
          editionLabel: item.editionLabel,
          name: item.name,
          tokenId: item.tokenId,
          image: item.image,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
        coupon: cart.coupon,
        subtotal: cart.subtotal,
        ...computeTotals(cart.subtotal, cart.coupon, network),
        expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
      }
      db.state.quotes = [...db.state.quotes.filter((q) => q.userId !== auth.user.id), quote]
      db.persist()
      const { userId: _userId, ...response } = quote
      return HttpResponse.json(response, { status: 201 })
    },
  ),

  http.post<PathParams, DefaultBodyType, Order | ApiErrorBody>(
    apiUrl('/orders'),
    async ({ request }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      const key = request.headers.get(IDEMPOTENCY_HEADER)
      if (!key) {
        return errorResponse(
          400,
          'VALIDATION_ERROR',
          `Cabeçalho ${IDEMPOTENCY_HEADER} obrigatório.`,
        )
      }
      const body = await readJson<CreateOrderRequest>(request)
      const requestHash = hashRequest(body)

      // Mesma tentativa (mesma chave) → devolve o MESMO pedido, sem criar outro.
      const existing = db.state.orders.find(
        (o) => o.userId === auth.user.id && o.idempotencyKey === key,
      )
      if (existing) {
        if (existing.requestHash !== requestHash) {
          return errorResponse(
            409,
            'IDEMPOTENCY_CONFLICT',
            'Esta tentativa de compra já foi usada com outros dados.',
          )
        }
        return HttpResponse.json(toOrder(existing))
      }

      const quote = db.state.quotes.find((q) => q.id === body?.quoteId && q.userId === auth.user.id)
      if (!quote || new Date(quote.expiresAt).getTime() < Date.now()) {
        return errorResponse(409, 'QUOTE_EXPIRED', 'A cotação expirou. Revise o pedido novamente.')
      }

      const wallets = db.state.wallets[auth.user.id]
      const wallet = [wallets?.primary, wallets?.secondary].find(
        (w) => w && w.id === body?.walletId,
      )
      const buyer = body?.buyer
      const fieldErrors: Record<string, string> = {}
      if (!wallet) fieldErrors.walletId = 'Selecione uma carteira cadastrada.'
      if (!buyer?.displayName?.trim()) fieldErrors.displayName = 'Informe o nome de exibição.'
      if (!buyer?.username?.trim()) fieldErrors.username = 'Informe o nome de usuário.'
      if (!buyer?.email || !EMAIL_PATTERN.test(buyer.email)) fieldErrors.email = 'E-mail inválido.'
      if (!wallet || !buyer || Object.keys(fieldErrors).length > 0) {
        return errorResponse(422, 'VALIDATION_ERROR', 'Revise os dados do pagamento.', fieldErrors)
      }

      // Revalida preço, estoque e cupom no momento da compra.
      for (const item of quote.items) {
        const nft = db.findNft(item.nftId)
        const edition = nft?.editions.find((e) => e.id === item.editionId)
        if (!nft || !edition || edition.available < item.quantity) {
          return errorResponse(409, 'OUT_OF_STOCK', `${item.name} não tem mais estoque suficiente.`)
        }
        if (compareEth(edition.price, item.unitPrice) !== 0) {
          return errorResponse(409, 'PRICE_CHANGED', `O preço de ${item.name} mudou.`)
        }
      }
      if (quote.coupon && !checkCoupon(quote.coupon.code).ok) {
        return errorResponse(409, 'COUPON_EXPIRED', 'O cupom deixou de valer. Revise o pedido.')
      }

      // Reserva o estoque e cria o pedido pendente (snapshot da cotação).
      for (const item of quote.items) {
        const nft = db.findNft(item.nftId)
        const edition = nft?.editions.find((e) => e.id === item.editionId)
        if (!nft || !edition) continue
        edition.available -= item.quantity
        commitNftChange(nft)
      }
      const now = new Date()
      const { userId: _userId, id: _quoteId, expiresAt: _expiresAt, ...snapshot } = quote
      const order: OrderRecord = {
        ...snapshot,
        id: db.nextId('ord'),
        status: 'pending',
        version: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        wallet: {
          id: wallet.id,
          type: wallet.type,
          nickname: wallet.nickname,
          address: wallet.address,
        },
        buyer,
        transaction: null,
        failureReason: null,
        userId: auth.user.id,
        idempotencyKey: key,
        requestHash,
        settleAt: new Date(now.getTime() + SETTLEMENT_DELAY_MS).toISOString(),
        outcome: getActiveScenario() === 'pagamento-recusado' ? 'declined' : 'confirmed',
      }
      db.state.orders.push(order)
      db.state.quotes = db.state.quotes.filter((q) => q.id !== quote.id)
      db.persist()
      scheduleSettlement(order)

      // Cenário: pedido criado, mas a resposta chega depois do timeout do cliente.
      if (getActiveScenario() === 'timeout-pedido' && !delayedKeys.has(key)) {
        delayedKeys.add(key)
        await delay(12_000)
      }
      return HttpResponse.json(toOrder(order), { status: 201 })
    },
  ),

  http.get<{ orderId: string }, DefaultBodyType, Order | ApiErrorBody>(
    apiUrl('/orders/:orderId'),
    async ({ request, params }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      // Pedido de outro usuário responde 404: não revela que existe.
      const order = db.state.orders.find(
        (o) => o.id === params.orderId && o.userId === auth.user.id,
      )
      if (!order) return errorResponse(404, 'NOT_FOUND', 'Pedido não encontrado.')
      return HttpResponse.json(toOrder(order))
    },
  ),
]
