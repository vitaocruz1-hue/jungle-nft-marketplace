import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { AddCartItemRequest, Cart } from '@/contracts/cart'
import { useSessionToken } from '@/features/auth/session'

import { acknowledgeCartChanges, addCartItem, getCart, removeCartItem, updateCartItem } from './api'

/** O carrinho é separado por sessão: o token (ou "guest") faz parte da chave. */
export const cartKeys = {
  all: ['cart'] as const,
  forSession: (token: string | null) => ['cart', token ?? 'guest'] as const,
}

export function cartQueryOptions(token: string | null) {
  return queryOptions({
    queryKey: cartKeys.forSession(token),
    queryFn: ({ signal }) => getCart(signal),
  })
}

export function useCart() {
  const token = useSessionToken()
  return useQuery(cartQueryOptions(token))
}

/** Toda mutation devolve o carrinho atualizado pela API: ele vira o novo cache. */
function useCartMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<Cart>) {
  const queryClient = useQueryClient()
  const token = useSessionToken()
  return useMutation({
    mutationFn,
    onSuccess: (cart) => queryClient.setQueryData(cartKeys.forSession(token), cart),
  })
}

export function useAddToCart() {
  return useCartMutation((body: AddCartItemRequest) => addCartItem(body))
}

export function useUpdateCartItem() {
  return useCartMutation(({ itemId, quantity }: { itemId: string; quantity: number }) =>
    updateCartItem(itemId, quantity),
  )
}

export function useRemoveCartItem() {
  return useCartMutation((itemId: string) => removeCartItem(itemId))
}

export function useAcknowledgeCartChanges() {
  return useCartMutation(() => acknowledgeCartChanges())
}
