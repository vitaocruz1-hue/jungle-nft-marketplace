import axios from 'axios'

import { env } from '@/config/env'
import { CART_ID_HEADER } from '@/contracts/cart'
import { toApiError } from '@/lib/api-error'
import { notifySessionEnded, sessionStore } from '@/lib/session-store'

/**
 * Cliente HTTP único do app. Toda chamada REST passa por aqui, então
 * tempo limite, cabeçalhos, sessão e tratamento de erro ficam centralizados.
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})

// Na ida: identifica o usuário (token) ou o carrinho do visitante.
apiClient.interceptors.request.use((config) => {
  const token = sessionStore.getToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  const guestCartId = sessionStore.getGuestCartId()
  if (guestCartId && !token) config.headers.set(CART_ID_HEADER, guestCartId)
  return config
})

// Na volta: qualquer falha vira ApiError. Se uma chamada autenticada recebe
// 401, a sessão acabou: o app limpa os dados privados e pede novo login.
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    const sentToken = axios.isAxiosError(error) && error.config?.headers?.has('Authorization')
    if (sentToken && (apiError.code === 'SESSION_EXPIRED' || apiError.code === 'UNAUTHENTICATED')) {
      notifySessionEnded()
    }
    return Promise.reject(apiError)
  },
)
