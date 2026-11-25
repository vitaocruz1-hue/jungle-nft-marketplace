import type { NetworkId, NftImage } from './catalog'
import type { AppliedCoupon } from './cart'
import type { EthAmount, IsoDateTime } from './common'
import type { WalletType } from './wallets'

export interface PricedItem {
  nftId: string
  editionId: string
  editionLabel: string
  name: string
  tokenId: string
  image: NftImage
  unitPrice: EthAmount
  quantity: number
  lineTotal: EthAmount
}

/**
 * POST /api/quote — cotação: congela itens, preços, cupom e taxa da rede
 * escolhida por alguns minutos. O pedido só é aceito com uma cotação válida.
 */
export interface Quote {
  id: string
  network: NetworkId
  items: PricedItem[]
  coupon: AppliedCoupon | null
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
  expiresAt: IsoDateTime
}

export interface CreateQuoteRequest {
  network: NetworkId
}

/** Dados do colecionador informados no pagamento. */
export interface CheckoutBuyer {
  displayName: string
  username: string
  profileName: string
  email: string
  referralCode: string
  ensName: string
  note: string
}

/** POST /api/orders (exige cabeçalho Idempotency-Key). */
export interface CreateOrderRequest {
  quoteId: string
  walletId: string
  buyer: CheckoutBuyer
}

export type OrderStatus = 'pending' | 'confirmed' | 'declined'

/** Pedido: um "retrato" (snapshot) da compra. Mudanças no catálogo não o alteram. */
export interface Order {
  id: string
  status: OrderStatus
  /** Aumenta a cada mudança de estado (ordena eventos order.updated). */
  version: number
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
  network: NetworkId
  items: PricedItem[]
  coupon: AppliedCoupon | null
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
  wallet: { id: string; type: WalletType; nickname: string; address: string }
  buyer: CheckoutBuyer
  /** Só existe em pedidos confirmados (referência simulada). */
  transaction: { hash: string; explorerUrl: string } | null
  failureReason: string | null
}

export const IDEMPOTENCY_HEADER = 'Idempotency-Key'
