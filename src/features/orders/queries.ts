import { queryOptions, useQuery } from '@tanstack/react-query'

import type { CreateOrderRequest, Order, OrderListResponse, Quote } from '@/contracts/orders'
import { IDEMPOTENCY_HEADER } from '@/contracts/orders'
import type { NetworkId } from '@/contracts/catalog'
import { privateKeys, useSession } from '@/features/auth/session'
import { apiClient } from '@/lib/api-client'
import { ApiError } from '@/lib/api-error'

export const orderKeys = {
  /** Lista e detalhes ficam sob ['me', userId, 'orders', …]. */
  list: (userId: string) => [...privateKeys.user(userId), 'orders', 'list'] as const,
  detail: (userId: string, orderId: string) =>
    [...privateKeys.user(userId), 'orders', orderId] as const,
}

export async function createQuote(network: NetworkId) {
  const { data } = await apiClient.post<Quote>('/quote', { network })
  return data
}

async function postOrder(body: CreateOrderRequest, idempotencyKey: string) {
  const { data } = await apiClient.post<Order>('/orders', body, {
    headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
  })
  return data
}

const RETRYABLE = new Set(['TIMEOUT', 'NETWORK_ERROR'])
const MAX_ATTEMPTS = 3

/**
 * Cria o pedido. Se a resposta se perder (timeout/rede), tenta de novo com a
 * MESMA chave de idempotência: a API devolve o pedido já criado em vez de
 * criar outro. Mutations não repetem sozinhas — esta repetição é explícita.
 */
export async function createOrder(body: CreateOrderRequest, idempotencyKey: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await postOrder(body, idempotencyKey)
    } catch (error) {
      const retry = error instanceof ApiError && RETRYABLE.has(error.code) && attempt < MAX_ATTEMPTS
      if (!retry) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}

async function getOrder(orderId: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<Order>(`/orders/${encodeURIComponent(orderId)}`, { signal })
  return data
}

export function orderQueryOptions(userId: string, orderId: string) {
  return queryOptions({
    queryKey: orderKeys.detail(userId, orderId),
    queryFn: ({ signal }) => getOrder(orderId, signal),
  })
}

export function useOrder(orderId: string) {
  const { user } = useSession()
  return useQuery({ ...orderQueryOptions(user?.id ?? '', orderId), enabled: user !== null })
}

async function getOrders(signal?: AbortSignal) {
  const { data } = await apiClient.get<OrderListResponse>('/orders', { signal })
  return data
}

export function orderListQueryOptions(userId: string) {
  return queryOptions({
    queryKey: orderKeys.list(userId),
    queryFn: ({ signal }) => getOrders(signal),
    // Sempre confere ao abrir a tela: um pedido recém-criado aparece na hora.
    staleTime: 0,
  })
}

/** Pedidos do usuário logado (tela /pedidos). */
export function useOrders() {
  const { user } = useSession()
  return useQuery({ ...orderListQueryOptions(user?.id ?? ''), enabled: user !== null })
}
