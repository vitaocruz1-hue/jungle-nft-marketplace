import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'

import type { ApiErrorBody } from '@/contracts/common'
import type { FavoritesResponse } from '@/contracts/favorites'

import { db } from '../db'
import { getActiveScenario, simulateNetwork } from '../scenarios'
import { requireAuth } from '../utils/auth'
import { apiUrl, errorResponse } from '../utils/http'

function favoritesOf(userId: string) {
  db.state.favorites[userId] ??= []
  return db.state.favorites[userId]
}

export const favoritesHandlers = [
  http.get<PathParams, DefaultBodyType, FavoritesResponse | ApiErrorBody>(
    apiUrl('/favorites'),
    async ({ request }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      return HttpResponse.json({ nftIds: [...favoritesOf(auth.user.id)] })
    },
  ),

  http.put<{ nftId: string }, DefaultBodyType, FavoritesResponse | ApiErrorBody>(
    apiUrl('/favorites/:nftId'),
    async ({ request, params }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      if (getActiveScenario() === 'falha-favoritos') {
        return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Não foi possível salvar o favorito.')
      }
      if (!db.findNft(params.nftId)) return errorResponse(404, 'NOT_FOUND', 'NFT não encontrado.')
      const list = favoritesOf(auth.user.id)
      if (!list.includes(params.nftId)) list.push(params.nftId)
      db.persist()
      return HttpResponse.json({ nftIds: [...list] })
    },
  ),

  http.delete<{ nftId: string }, DefaultBodyType, FavoritesResponse | ApiErrorBody>(
    apiUrl('/favorites/:nftId'),
    async ({ request, params }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      if (getActiveScenario() === 'falha-favoritos') {
        return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Não foi possível remover o favorito.')
      }
      db.state.favorites[auth.user.id] = favoritesOf(auth.user.id).filter(
        (id) => id !== params.nftId,
      )
      db.persist()
      return HttpResponse.json({ nftIds: [...favoritesOf(auth.user.id)] })
    },
  ),
]
