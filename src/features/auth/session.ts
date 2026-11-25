import { queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

import { sessionStore } from '@/lib/session-store'

import { getSession } from './api'

/**
 * Chaves de dados privados. Tudo que é do usuário fica sob ['me', userId, ...]
 * e o carrinho sob ['cart', identidade]: ao sair ou trocar de usuário,
 * `clearPrivateData` apaga esses dados do cache de uma vez.
 */
export const privateKeys = {
  all: ['me'] as const,
  user: (userId: string) => ['me', userId] as const,
}

export function sessionQueryOptions(token: string | null) {
  return queryOptions({
    queryKey: ['session', token] as const,
    queryFn: ({ signal }) => (token ? getSession(signal) : null),
    staleTime: 5 * 60_000,
    retry: false,
  })
}

export function useSessionToken() {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getToken)
}

/** Usuário logado (ou null). */
export function useSession() {
  const token = useSessionToken()
  const query = useQuery(sessionQueryOptions(token))
  const user = token ? (query.data?.user ?? null) : null
  return {
    user,
    isAuthenticated: user !== null,
    isLoading: token !== null && query.isPending,
  }
}

export function clearPrivateData(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: privateKeys.all })
  queryClient.removeQueries({ queryKey: ['cart'] })
  queryClient.removeQueries({ queryKey: ['session'] })
}

/** Só aceita caminhos internos como destino após o login (evita redirecionamento aberto). */
export function safeRedirect(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}
