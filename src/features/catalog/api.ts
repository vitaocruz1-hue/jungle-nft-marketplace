import type {
  FeaturedResponse,
  NftDetail,
  NftListParams,
  NftListResponse,
} from '@/contracts/catalog'
import { apiClient } from '@/lib/api-client'

/**
 * Chamadas REST do catálogo. O `signal` vem do TanStack Query e permite
 * cancelar uma requisição que ficou obsoleta (ex.: o usuário mudou o filtro).
 */

export async function getNfts(params: NftListParams, signal?: AbortSignal) {
  const { data } = await apiClient.get<NftListResponse>('/nfts', { params, signal })
  return data
}

export async function getFeatured(signal?: AbortSignal) {
  const { data } = await apiClient.get<FeaturedResponse>('/featured', { signal })
  return data
}

export async function getNft(nftId: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<NftDetail>(`/nfts/${encodeURIComponent(nftId)}`, {
    signal,
  })
  return data
}
