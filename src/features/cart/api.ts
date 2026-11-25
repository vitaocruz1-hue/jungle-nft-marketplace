import type { AddCartItemRequest, Cart } from '@/contracts/cart'
import { apiClient } from '@/lib/api-client'
import { sessionStore } from '@/lib/session-store'

/** Visitante: guarda o id do carrinho criado pela API para as próximas chamadas. */
function remember(cart: Cart) {
  if (!sessionStore.getToken()) sessionStore.setGuestCartId(cart.id)
  return cart
}

export async function getCart(signal?: AbortSignal) {
  const { data } = await apiClient.get<Cart>('/cart', { signal })
  return remember(data)
}

export async function addCartItem(body: AddCartItemRequest) {
  const { data } = await apiClient.post<Cart>('/cart/items', body)
  return remember(data)
}

export async function updateCartItem(itemId: string, quantity: number) {
  const { data } = await apiClient.patch<Cart>(`/cart/items/${encodeURIComponent(itemId)}`, {
    quantity,
  })
  return remember(data)
}

export async function removeCartItem(itemId: string) {
  const { data } = await apiClient.delete<Cart>(`/cart/items/${encodeURIComponent(itemId)}`)
  return remember(data)
}

export async function acknowledgeCartChanges() {
  const { data } = await apiClient.post<Cart>('/cart/acknowledge')
  return remember(data)
}
