import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'

import type { ApiErrorBody } from '@/contracts/common'
import type { FavoritesResponse } from '@/contracts/favorites'

import { db } from '../db'
import { getActiveScenario, simulateNetwork } from '../scenarios'
import { requireAuth } from '../utils/auth'
import { apiUrl, errorResponse } from '../utils/http'
import { toSummary } from '../utils/nft'

function favoritesOf(userId: string) {
  db.state.favorites[userId] ??= []
  return db.state.favorites[userId]
}

/** IDs na ordem em que foram favoritados + cards do mais recente ao mais antigo. */
function favoritesResponse(userId: string): FavoritesResponse {
  const nftIds = [...favoritesOf(userId)]
  const items = nftIds.toReversed().flatMap((id) => {
    const nft = db.findNft(id)
    return nft ? [toSummary(nft)] : []
  })
  return { nftIds, items }
}

export const favoritesHandlers = [
  http.get<PathParams, DefaultBodyType, FavoritesResponse | ApiErrorBody>(
    apiUrl('/favorites'),
    async ({ request }) => {
      await simulateNetwork()
      const auth = requireAuth(request)
      if (!auth.ok) return auth.response
      return HttpResponse.json(favoritesResponse(auth.user.id))
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
      return HttpResponse.json(favoritesResponse(auth.user.id))
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
      return HttpResponse.json(favoritesResponse(auth.user.id))
    },
  ),
]
