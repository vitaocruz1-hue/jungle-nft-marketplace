import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { FeaturedResponse, NftDetail, NftListResponse, NftSummary } from '@/contracts/catalog'
import type { Cart, CartItem } from '@/contracts/cart'
import type { FavoritesResponse } from '@/contracts/favorites'
import type { Order, OrderListResponse } from '@/contracts/orders'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/realtime'
import { privateKeys } from '@/features/auth/session'
import { catalogKeys } from '@/features/catalog/queries'
import { cartKeys } from '@/features/cart/queries'
import { orderKeys } from '@/features/orders/queries'
import { compareEth, displayEth, normalizeEth } from '@/lib/eth'

import { flashPrice, isNftOnScreen, notifyNftChanged } from './realtime-store'

/** Aplica preço/estoque novos num NFT do cache, só se a versão for mais nova. */
function patchSummary<T extends NftSummary>(nft: T, event: NftUpdatedEvent): T {
  if (nft.id !== event.resource.id || event.version <= nft.version) return nft
  return {
    ...nft,
    price: event.data.price,
    compareAtPrice: event.data.compareAtPrice,
    soldOut: event.data.soldOut,
    version: event.version,
  }
}

function patchDetail(nft: NftDetail, event: NftUpdatedEvent): NftDetail {
  if (event.version <= nft.version) return nft
  const updates = new Map(event.data.editions.map((e) => [e.id, e]))
  return {
    ...patchSummary(nft, event),
    editions: nft.editions.map((edition) => {
      const update = updates.get(edition.id)
      return update ? { ...edition, price: update.price, available: update.available } : edition
    }),
  }
}

/** Último retrato conhecido do NFT em qualquer cache (detalhe, listas, favoritos…). */
function findCachedSummary(queryClient: QueryClient, nftId: string): NftSummary | undefined {
  const detail = queryClient.getQueryData<NftDetail>(catalogKeys.detail(nftId))
  if (detail) return detail
  const lists = queryClient.getQueriesData<NftListResponse>({ queryKey: catalogKeys.lists() })
  const related = queryClient.getQueriesData<NftSummary[]>({
    queryKey: [...catalogKeys.all, 'related'],
  })
  const favorites = queryClient.getQueriesData<FavoritesResponse>({
    queryKey: privateKeys.all,
    predicate: (query) => query.queryKey[2] === 'favorites',
  })
  const candidates = [
    ...lists.flatMap(([, data]) => data?.items ?? []),
    ...related.flatMap(([, data]) => data ?? []),
    ...favorites.flatMap(([, data]) => data?.items ?? []),
  ]
  return candidates
    .filter((nft) => nft.id === nftId)
    .reduce<NftSummary | undefined>(
      (best, nft) => (!best || nft.version > best.version ? nft : best),
      undefined,
    )
}

function findCartItem(queryClient: QueryClient, nftId: string): CartItem | undefined {
  return queryClient
    .getQueriesData<Cart>({ queryKey: cartKeys.all })
    .flatMap(([, cart]) => cart?.items ?? [])
    .find((item) => item.nftId === nftId)
}

type Change = { kind: 'price' | 'sold-out'; message: string }

/**
 * Texto do aviso. No carrinho vale a edição escolhida; fora dele, o preço do
 * card/detalhe. Sem mudança visível (ex.: a API já tinha trazido o valor novo),
 * não há aviso.
 */
function describeChange(
  event: NftUpdatedEvent,
  before: NftSummary | undefined,
  cartItem: CartItem | undefined,
): Change | null {
  if (cartItem) {
    const edition = event.data.editions.find((e) => e.id === cartItem.editionId)
    const label = `${cartItem.name} (edição ${cartItem.editionLabel})`
    if (edition && edition.available === 0 && cartItem.available > 0) {
      return { kind: 'sold-out', message: `${label} esgotou.` }
    }
    if (edition && compareEth(edition.price, cartItem.unitPrice) !== 0) {
      return {
        kind: 'price',
        message: `Preço do ${label} mudou de ${normalizeEth(cartItem.unitPrice)} para ${displayEth(edition.price)}.`,
      }
    }
  }
  if (!before || event.version <= before.version) return null
  if (event.data.soldOut && !before.soldOut) {
    return { kind: 'sold-out', message: `${before.name} esgotou.` }
  }
  if (compareEth(event.data.price, before.price) !== 0) {
    return {
      kind: 'price',
      message: `Preço do ${before.name} mudou de ${normalizeEth(before.price)} para ${displayEth(event.data.price)}.`,
    }
  }
  return null
}

/** nft.updated: atualiza catálogo, destaques, detalhe e carrinho. */
export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent) {
  const nftId = event.resource.id
  // Lido ANTES de atualizar o cache: é o "de" do aviso ("mudou de 1.19 para 2.50 ETH").
  const before = findCachedSummary(queryClient, nftId)
  const cartItem = findCartItem(queryClient, nftId)

  queryClient.setQueriesData<NftListResponse>({ queryKey: catalogKeys.lists() }, (old) =>
    old ? { ...old, items: old.items.map((nft) => patchSummary(nft, event)) } : old,
  )
  queryClient.setQueryData<NftDetail>(catalogKeys.detail(nftId), (old) =>
    old ? patchDetail(old, event) : old,
  )
  queryClient.setQueryData<FeaturedResponse>(catalogKeys.featured(), (old) =>
    old
      ? {
          hero: old.hero.map((item) => ({ ...item, nft: patchSummary(item.nft, event) })),
          spotlight: { ...old.spotlight, nft: patchSummary(old.spotlight.nft, event) },
        }
      : old,
  )
  queryClient.setQueriesData<NftSummary[]>({ queryKey: [...catalogKeys.all, 'related'] }, (old) =>
    old?.map((nft) => patchSummary(nft, event)),
  )
  // Tela de favoritos (cache por usuário: ['me', userId, 'favorites']).
  queryClient.setQueriesData<FavoritesResponse>(
    { queryKey: privateKeys.all, predicate: (query) => query.queryKey[2] === 'favorites' },
    (old) => (old ? { ...old, items: old.items.map((nft) => patchSummary(nft, event)) } : old),
  )

  // Carrinho: a API recalcula preços, avisos e totais; buscamos de novo.
  if (cartItem) void queryClient.invalidateQueries({ queryKey: cartKeys.all })

  // Aviso só para o que o usuário está vendo (na tela ou no carrinho).
  const change = describeChange(event, before, cartItem)
  if (change && (cartItem || isNftOnScreen(nftId))) {
    const show = change.kind === 'sold-out' ? toast.warning : toast.info
    // Um aviso por NFT: uma mudança nova substitui a anterior em vez de empilhar.
    show(change.message, { id: `nft-${nftId}` })
    flashPrice(nftId)
  }

  notifyNftChanged(event)
}

/** order.updated: atualiza o pedido e, se confirmado, o carrinho. */
export function applyOrderUpdated(queryClient: QueryClient, event: OrderUpdatedEvent) {
  const key = orderKeys.detail(event.userId, event.resource.id)
  queryClient.setQueryData<Order>(key, (old) =>
    old && event.version > old.version
      ? {
          ...old,
          status: event.data.status,
          failureReason: event.data.failureReason,
          version: event.version,
        }
      : old,
  )
  // Tela "Meus pedidos": o status muda na hora, sem esperar a API.
  queryClient.setQueryData<OrderListResponse>(orderKeys.list(event.userId), (old) =>
    old
      ? {
          items: old.items.map((order) =>
            order.id === event.resource.id && event.version > order.version
              ? {
                  ...order,
                  status: event.data.status,
                  failureReason: event.data.failureReason,
                  version: event.version,
                }
              : order,
          ),
        }
      : old,
  )
  // Busca o pedido completo (ex.: referência da transação) pela API REST.
  void queryClient.invalidateQueries({ queryKey: key })
  if (event.data.status === 'confirmed')
    void queryClient.invalidateQueries({ queryKey: cartKeys.all })
}

/**
 * A cada conexão (inclusive a primeira) reconcilia com a API REST o que pode
 * ter mudado enquanto não havia socket: eventos emitidos nesse intervalo se
 * perderiam (ex.: pedido confirmado logo após o F5). Dados iguais não
 * redesenham a tela (structural sharing do TanStack Query).
 */
export function reconcileOnConnect(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
  void queryClient.invalidateQueries({ queryKey: cartKeys.all })
  void queryClient.invalidateQueries({ queryKey: privateKeys.all })
}
