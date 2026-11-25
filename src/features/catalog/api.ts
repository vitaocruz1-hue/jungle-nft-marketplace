import type {
  FeaturedResponse,
  NftDetail,
  NftListParams,
  NftListResponse,
  NftSummary,
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

/** Recomendações variadas; `exclude` tira da lista (ex.: o que já está no carrinho). */
export async function getRelatedNfts(nftId: string, exclude: string[] = [], signal?: AbortSignal) {
  const { data } = await apiClient.get<NftSummary[]>(`/nfts/${encodeURIComponent(nftId)}/related`, {
    params: exclude.length > 0 ? { exclude: exclude.join(',') } : undefined,
    signal,
  })
  return data
}
