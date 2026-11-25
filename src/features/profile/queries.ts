import { useMutation, useQueryClient } from '@tanstack/react-query'

import type {
  ChangePasswordRequest,
  SessionResponse,
  UpdateProfileRequest,
  User,
} from '@/contracts/auth'
import { apiClient } from '@/lib/api-client'

/** Depois de salvar, o usuário da sessão (cabeçalho, menu) reflete os novos dados. */
function useSyncSessionUser() {
  const queryClient = useQueryClient()
  return (user: User) =>
    queryClient.setQueriesData<SessionResponse | null>({ queryKey: ['session'] }, (old) =>
      old ? { ...old, user } : old,
    )
}

export function useUpdateProfile() {
  const sync = useSyncSessionUser()
  return useMutation({
    mutationFn: async (body: UpdateProfileRequest) =>
      (await apiClient.patch<User>('/profile', body)).data,
    onSuccess: sync,
  })
}

export function useUpdateAvatar() {
  const sync = useSyncSessionUser()
  return useMutation({
    mutationFn: async (dataUrl: string) =>
      (await apiClient.put<User>('/profile/avatar', { dataUrl })).data,
    onSuccess: sync,
  })
}

export function useRemoveAvatar() {
  const sync = useSyncSessionUser()
  return useMutation({
    mutationFn: async () => (await apiClient.delete<User>('/profile/avatar')).data,
    onSuccess: sync,
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (body: ChangePasswordRequest) => {
      await apiClient.post('/profile/password', body)
    },
  })
}
