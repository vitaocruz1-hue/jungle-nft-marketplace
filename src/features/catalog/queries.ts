import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import type { NftListParams } from '@/contracts/catalog'

import { getFeatured, getNft, getNfts, getRelatedNfts } from './api'

/**
 * Chaves do cache do catálogo. Cada combinação de filtros tem a sua chave,
 * então uma resposta atrasada nunca aparece no lugar da consulta atual.
 */
export const catalogKeys = {
  all: ['nfts'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  list: (params: NftListParams) => [...catalogKeys.lists(), params] as const,
  details: () => [...catalogKeys.all, 'detail'] as const,
  detail: (nftId: string) => [...catalogKeys.details(), nftId] as const,
  featured: () => [...catalogKeys.all, 'featured'] as const,
  related: (nftId: string, exclude: string[] = []) =>
    [...catalogKeys.all, 'related', nftId, exclude] as const,
}

export function nftListQueryOptions(params: NftListParams) {
  return queryOptions({
    queryKey: catalogKeys.list(params),
    queryFn: ({ signal }) => getNfts(params, signal),
    // Ao trocar de filtro/página, mantém a lista anterior visível até a nova chegar.
    placeholderData: keepPreviousData,
  })
}

export function featuredQueryOptions() {
  return queryOptions({
    queryKey: catalogKeys.featured(),
    queryFn: ({ signal }) => getFeatured(signal),
  })
}

export function nftDetailQueryOptions(nftId: string) {
  return queryOptions({
    queryKey: catalogKeys.detail(nftId),
    queryFn: ({ signal }) => getNft(nftId, signal),
  })
}

export function relatedNftsQueryOptions(nftId: string, exclude: string[] = []) {
  return queryOptions({
    queryKey: catalogKeys.related(nftId, exclude),
    queryFn: ({ signal }) => getRelatedNfts(nftId, exclude, signal),
  })
}
