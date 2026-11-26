import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { FavoritesResponse } from '@/contracts/favorites'
import { privateKeys, useSession } from '@/features/auth/session'
import { apiClient } from '@/lib/api-client'
import { getErrorMessage } from '@/lib/api-error'

async function getFavorites(signal?: AbortSignal) {
  const { data } = await apiClient.get<FavoritesResponse>('/favorites', { signal })
  return data
}

async function setFavorite(nftId: string, favorite: boolean) {
  const url = `/favorites/${encodeURIComponent(nftId)}`
  const { data } = favorite
    ? await apiClient.put<FavoritesResponse>(url)
    : await apiClient.delete<FavoritesResponse>(url)
  return data
}

const favoritesKey = (userId: string) => [...privateKeys.user(userId), 'favorites'] as const

export function favoritesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: favoritesKey(userId),
    queryFn: ({ signal }) => getFavorites(signal),
  })
}

/** Favoritos do usuário logado (vazio para visitantes). */
export function useFavorites() {
  const { user } = useSession()
  const query = useQuery({ ...favoritesQueryOptions(user?.id ?? ''), enabled: user !== null })
  const ids = new Set(query.data?.nftIds ?? [])
  return { isFavorite: (nftId: string) => ids.has(nftId), isLoading: query.isPending && !!user }
}

/** Lista completa (tela /favoritos). Mesma chave de cache dos corações. */
export function useFavoritesList() {
  const { user } = useSession()
  return useQuery({ ...favoritesQueryOptions(user?.id ?? ''), enabled: user !== null })
}

/**
 * Favoritar/desfavoritar com ATUALIZAÇÃO OTIMISTA: o coração muda na hora;
 * se a API falhar, volta ao estado anterior (rollback) e avisa o usuário.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { user } = useSession()

  return useMutation({
    mutationFn: ({ nftId, favorite }: { nftId: string; favorite: boolean }) =>
      setFavorite(nftId, favorite),
    onMutate: async ({ nftId, favorite }) => {
      if (!user) return { previous: undefined }
      const key = favoritesKey(user.id)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      queryClient.setQueryData<FavoritesResponse>(key, (old) => {
        const current = new Set(old?.nftIds ?? [])
        if (favorite) current.add(nftId)
        else current.delete(nftId)
        // Desfavoritar tira o card na hora; ao favoritar, o card chega com a resposta da API.
        const items = (old?.items ?? []).filter((item) => favorite || item.id !== nftId)
        return { nftIds: [...current], items }
      })
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (user && context?.previous !== undefined)
        queryClient.setQueryData(favoritesKey(user.id), context.previous)
      toast.error('Não foi possível atualizar seus favoritos', {
        description: getErrorMessage(error),
      })
    },
    onSuccess: (data, { favorite }) => {
      if (user) queryClient.setQueryData(favoritesKey(user.id), data)
      toast.success(favorite ? 'Adicionado aos favoritos' : 'Removido dos favoritos')
    },
    // Sucesso ou falha: confere com a API (cobre o caso de não haver estado anterior).
    onSettled: () => {
      if (user) void queryClient.invalidateQueries({ queryKey: favoritesKey(user.id) })
    },
  })
}
