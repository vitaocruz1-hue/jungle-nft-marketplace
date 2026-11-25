import type { NftImage } from './catalog'
import type { EthAmount, IsoDateTime } from './common'

/** Problemas que a API detecta em um item (preço/estoque mudaram desde que foi adicionado). */
export type CartItemIssue = 'PRICE_CHANGED' | 'OUT_OF_STOCK' | 'QUANTITY_UNAVAILABLE'

export interface CartItem {
  id: string
  nftId: string
  editionId: string
  editionLabel: string
  name: string
  tokenId: string
  image: NftImage
  /** Preço atual da edição. */
  unitPrice: EthAmount
  /** Preço quando o item foi adicionado (para avisar mudanças). */
  addedUnitPrice: EthAmount
  quantity: number
  /** Estoque atual da edição. */
  available: number
  maxPerOrder: number
  lineTotal: EthAmount
  issues: CartItemIssue[]
}

/** GET /api/cart — carrinho do usuário logado ou do visitante (X-Cart-Id). */
export interface Cart {
  id: string
  items: CartItem[]
  itemCount: number
  subtotal: EthAmount
  updatedAt: IsoDateTime
}

/** POST /api/cart/items */
export interface AddCartItemRequest {
  nftId: string
  editionId: string
  quantity: number
}

/** PATCH /api/cart/items/:itemId */
export interface UpdateCartItemRequest {
  quantity: number
}

/** Cabeçalho que identifica o carrinho do visitante. */
export const CART_ID_HEADER = 'X-Cart-Id'
