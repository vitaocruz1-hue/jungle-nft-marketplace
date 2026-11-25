import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { FeaturedResponse, NftDetail, NftListResponse, NftSummary } from '@/contracts/catalog'
import type { Cart } from '@/contracts/cart'
import type { Order } from '@/contracts/orders'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/realtime'
import { privateKeys } from '@/features/auth/session'
import { catalogKeys } from '@/features/catalog/queries'
import { cartKeys } from '@/features/cart/queries'
import { displayEth } from '@/lib/eth'

import { notifyNftChanged } from './realtime-store'

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

/** nft.updated: atualiza catálogo, destaques, detalhe e carrinho. */
export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent) {
  const nftId = event.resource.id

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

  // Carrinho: a API recalcula preços, avisos e totais; buscamos de novo.
  const carts = queryClient.getQueriesData<Cart>({ queryKey: cartKeys.all })
  const inCart = carts.flatMap(([, cart]) => cart?.items ?? []).find((i) => i.nftId === nftId)
  if (inCart) {
    void queryClient.invalidateQueries({ queryKey: cartKeys.all })
    const edition = event.data.editions.find((e) => e.id === inCart.editionId)
    if (edition && edition.available === 0) {
      toast.warning(`${inCart.name} (edição ${inCart.editionLabel}) esgotou.`)
    } else if (edition && edition.price !== inCart.unitPrice) {
      toast.info(`O preço de ${inCart.name} mudou para ${displayEth(edition.price)}.`)
    }
  }

  notifyNftChanged(event)
}

export const orderKeys = {
  detail: (userId: string, orderId: string) =>
    [...privateKeys.user(userId), 'orders', orderId] as const,
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
  // Busca o pedido completo (ex.: referência da transação) pela API REST.
  void queryClient.invalidateQueries({ queryKey: key })
  if (event.data.status === 'confirmed')
    void queryClient.invalidateQueries({ queryKey: cartKeys.all })
}

/** Após reconectar: reconcilia com a API tudo que pode ter mudado offline. */
export function reconcileAfterReconnect(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
  void queryClient.invalidateQueries({ queryKey: cartKeys.all })
  void queryClient.invalidateQueries({ queryKey: privateKeys.all })
}
