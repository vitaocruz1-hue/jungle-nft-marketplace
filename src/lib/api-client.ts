import axios, { type AxiosResponse } from 'axios'

import { env } from '@/config/env'
import { CART_ID_HEADER } from '@/contracts/cart'
import { MOCK_RESPONSE_HEADER } from '@/contracts/common'
import {
  hasJsonContentType,
  mocksUnavailableError,
  notJsonError,
  toApiError,
} from '@/lib/api-error'
import { getNetworkRecovery, whenNetworkReady } from '@/lib/network-ready'
import { notifySessionEnded, sessionStore } from '@/lib/session-store'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Já foi repetida depois de reativar a API simulada (no máximo 1 vez). */
    kurioRecovered?: boolean
  }
}

/**
 * Cliente HTTP único do app. Toda chamada REST passa por aqui, então
 * tempo limite, cabeçalhos, sessão e tratamento de erro ficam centralizados.
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})

// Na ida: espera a rede (mocks) ficar pronta e identifica o usuário (token)
// ou o carrinho do visitante.
apiClient.interceptors.request.use(async (config) => {
  // Sem a API simulada ativa, falha na hora com um erro claro (nada vai para a hospedagem).
  await whenNetworkReady().catch(() => {
    throw mocksUnavailableError()
  })
  const token = sessionStore.getToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  const guestCartId = sessionStore.getGuestCartId()
  if (guestCartId && !token) config.headers.set(CART_ID_HEADER, guestCartId)
  return config
})

/**
 * Resposta sem JSON = não veio da API simulada: o service worker deixou a
 * chamada passar direto para a hospedagem. Reativa o MSW e repete a chamada uma
 * vez (ela não chegou ao "servidor", então repetir não duplica nada).
 */
async function retryAfterRecovery(response: AxiosResponse): Promise<AxiosResponse | null> {
  const recover = getNetworkRecovery()
  const { config } = response
  const fromMock = response.headers[MOCK_RESPONSE_HEADER] === '1'
  if (fromMock || config.kurioRecovered || !recover) return null
  if (!(await recover())) return null
  return apiClient.request({ ...config, kurioRecovered: true })
}

// Na volta: resposta com corpo que não é JSON não é da API (ex.: o index.html da
// hospedagem): o app tenta reativar a API simulada e repetir; se não der, vira
// erro de rede, nunca "dado". Qualquer falha vira ApiError.
// Se uma chamada autenticada recebe 401, a sessão acabou: o app limpa os dados
// privados e pede novo login.
apiClient.interceptors.response.use(
  async (response) => {
    const emptyBody = response.status === 204 || response.data === '' || response.data == null
    if (emptyBody || hasJsonContentType(response.headers)) return response
    const retried = await retryAfterRecovery(response)
    if (retried) return retried
    throw notJsonError()
  },
  async (error: unknown) => {
    // Erro sem JSON (ex.: 404 da hospedagem): também não veio da API simulada.
    if (
      axios.isAxiosError(error) &&
      error.response &&
      !hasJsonContentType(error.response.headers)
    ) {
      const retried = await retryAfterRecovery(error.response)
      if (retried) return retried
    }
    const apiError = toApiError(error)
    const sentToken = axios.isAxiosError(error) && error.config?.headers?.has('Authorization')
    if (sentToken && (apiError.code === 'SESSION_EXPIRED' || apiError.code === 'UNAUTHENTICATED')) {
      notifySessionEnded()
    }
    return Promise.reject(apiError)
  },
)
