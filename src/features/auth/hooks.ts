import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'

import type { AuthResponse, SessionResponse } from '@/contracts/auth'
import { onSessionEnded, sessionStore } from '@/lib/session-store'

import { login, logout, register } from './api'
import { clearPrivateData, sessionQueryOptions } from './session'

/** Depois de entrar/cadastrar: nada do usuário anterior fica no cache. */
function startSession(queryClient: QueryClient, data: AuthResponse) {
  clearPrivateData(queryClient)
  // A API já moveu os itens do visitante para o carrinho da conta.
  sessionStore.clearGuestCartId()
  const session: SessionResponse = { user: data.user, expiresAt: data.expiresAt }
  queryClient.setQueryData(sessionQueryOptions(data.token).queryKey, session)
  sessionStore.setToken(data.token)
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => startSession(queryClient, data),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: register,
    onSuccess: (data) => startSession(queryClient, data),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Mesmo se a chamada falhar, a sessão local termina.
      sessionStore.clearToken()
      clearPrivateData(queryClient)
      toast.success('Você saiu da sua conta.')
      void navigate({ to: '/' })
    },
  })
}

/**
 * Escuta "sessão acabou" (401 em chamada autenticada): limpa dados privados e
 * leva ao login guardando a página atual para retomar depois.
 */
export function useSessionExpiryHandler() {
  const queryClient = useQueryClient()
  const router = useRouter()

  useEffect(() => {
    return onSessionEnded(() => {
      // Várias chamadas podem falhar juntas: só a primeira age.
      if (!sessionStore.getToken()) return
      sessionStore.clearToken()
      clearPrivateData(queryClient)
      toast.warning('Sua sessão expirou', { description: 'Entre novamente para continuar.' })
      const { pathname, searchStr, hash } = router.state.location
      const current = `${pathname}${searchStr}${hash ? `#${hash}` : ''}`
      void router.navigate({ to: '/login', search: { redirect: current, motivo: 'expirada' } })
    })
  }, [queryClient, router])
}
