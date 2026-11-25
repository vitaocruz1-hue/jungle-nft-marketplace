import { http, HttpResponse, type DefaultBodyType, type PathParams } from 'msw'

import {
  CATALOG_SORTS,
  CATALOG_TABS,
  CATEGORY_IDS,
  CATEGORY_LABELS,
  NETWORK_IDS,
  NETWORK_LABELS,
  type CatalogSort,
  type CatalogTab,
  type CategoryId,
  type FeaturedResponse,
  type NetworkId,
  type NftDetail,
  type NftListResponse,
  type NftSummary,
} from '@/contracts/catalog'
import type { ApiErrorBody } from '@/contracts/common'
import { compareEth, formatWei, isEthAmount, parseEth } from '@/lib/eth'

import { db } from '../db'
import { FEATURED_IDS, LARGE_ART, type NftRecord } from '../db/fixtures/nfts'
import { simulateNetwork } from '../scenarios'
import { apiUrl, errorResponse } from '../utils/http'

const DEFAULT_PAGE_SIZE = 9
const MAX_PAGE_SIZE = 48

/** Preço exibido = menor preço entre as edições com estoque. */
function currentPrice(nft: NftRecord): string {
  const available = nft.editions.filter((e) => e.available > 0)
  const pool = available.length > 0 ? available : nft.editions
  const min = pool.reduce(
    (lowest, e) => (compareEth(e.price, lowest) < 0 ? e.price : lowest),
    pool[0]?.price ?? nft.price,
  )
  return formatWei(parseEth(min))
}

export function toSummary(nft: NftRecord): NftSummary {
  return {
    id: nft.id,
    name: nft.name,
    image: nft.image,
    price: currentPrice(nft),
    compareAtPrice: nft.compareAtPrice,
    category: nft.category,
    network: nft.network,
    soldOut: nft.editions.every((e) => e.available === 0),
    version: nft.version,
  }
}

export function toDetail(nft: NftRecord): NftDetail {
  // Campos internos (listedAt, isNew, isTrending) não saem na resposta.
  const { listedAt: _listedAt, isNew: _isNew, isTrending: _isTrending, ...detail } = nft
  return { ...detail, ...toSummary(nft) }
}

/** Remove acentos e caixa: "Música" e "musica" casam. */
function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

interface ListFilters {
  search?: string
  category?: CategoryId
  network?: NetworkId
  minPrice?: string
  maxPrice?: string
  tab: CatalogTab
}

function matches(nft: NftRecord, f: ListFilters, ignore?: 'category' | 'network') {
  if (f.search) {
    const haystack = normalize(`${nft.name} ${nft.collection.name} ${nft.creator}`)
    if (!haystack.includes(normalize(f.search))) return false
  }
  if (ignore !== 'category' && f.category && nft.category !== f.category) return false
  if (ignore !== 'network' && f.network && nft.network !== f.network) return false
  const price = currentPrice(nft)
  if (f.minPrice && compareEth(price, f.minPrice) < 0) return false
  if (f.maxPrice && compareEth(price, f.maxPrice) > 0) return false
  if (f.tab === 'new' && !nft.isNew) return false
  if (f.tab === 'trending' && !nft.isTrending) return false
  return true
}

const SORTERS: Record<CatalogSort, (a: NftRecord, b: NftRecord) => number> = {
  recent: (a, b) => b.listedAt.localeCompare(a.listedAt),
  'price-asc': (a, b) =>
    compareEth(currentPrice(a), currentPrice(b)) || a.name.localeCompare(b.name),
  'price-desc': (a, b) =>
    compareEth(currentPrice(b), currentPrice(a)) || a.name.localeCompare(b.name),
  'name-asc': (a, b) => a.name.localeCompare(b.name, 'pt-BR'),
}

function oneOf<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | undefined | null {
  if (value === null || value === '') return undefined
  return (allowed as readonly string[]).includes(value) ? (value as T) : null
}

function positiveInt(value: string | null, fallback: number): number | null {
  if (value === null || value === '') return fallback
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 ? n : null
}

export const catalogHandlers = [
  http.get<PathParams, DefaultBodyType, NftListResponse | ApiErrorBody>(
    apiUrl('/nfts'),
    async ({ request }) => {
      await simulateNetwork()
      const params = new URL(request.url).searchParams

      const category = oneOf(params.get('category'), CATEGORY_IDS)
      const network = oneOf(params.get('network'), NETWORK_IDS)
      const tab = oneOf(params.get('tab'), CATALOG_TABS)
      const sort = oneOf(params.get('sort'), CATALOG_SORTS)
      const page = positiveInt(params.get('page'), 1)
      const pageSize = positiveInt(params.get('pageSize'), DEFAULT_PAGE_SIZE)
      const minPrice = params.get('minPrice') || undefined
      const maxPrice = params.get('maxPrice') || undefined

      const fieldErrors: Record<string, string> = {}
      if (category === null) fieldErrors.category = 'Categoria inválida'
      if (network === null) fieldErrors.network = 'Rede inválida'
      if (tab === null) fieldErrors.tab = 'Aba inválida'
      if (sort === null) fieldErrors.sort = 'Ordenação inválida'
      if (page === null) fieldErrors.page = 'Página deve ser um inteiro ≥ 1'
      if (pageSize === null || pageSize > MAX_PAGE_SIZE)
        fieldErrors.pageSize = `Entre 1 e ${MAX_PAGE_SIZE}`
      if (minPrice && !isEthAmount(minPrice)) fieldErrors.minPrice = 'Valor em ETH inválido'
      if (maxPrice && !isEthAmount(maxPrice)) fieldErrors.maxPrice = 'Valor em ETH inválido'
      if (Object.keys(fieldErrors).length > 0) {
        return errorResponse(400, 'VALIDATION_ERROR', 'Parâmetros de busca inválidos.', fieldErrors)
      }

      const filters: ListFilters = {
        search: params.get('search')?.trim() || undefined,
        category: category ?? undefined,
        network: network ?? undefined,
        minPrice,
        maxPrice,
        tab: tab ?? 'all',
      }

      const all = db.state.nfts
      const results = all.filter((nft) => matches(nft, filters)).sort(SORTERS[sort ?? 'recent'])
      const size = pageSize ?? DEFAULT_PAGE_SIZE
      const totalPages = Math.max(1, Math.ceil(results.length / size))
      const currentPage = page ?? 1
      const start = (currentPage - 1) * size

      const prices = all.map(currentPrice).sort(compareEth)

      return HttpResponse.json<NftListResponse>({
        items: results.slice(start, start + size).map(toSummary),
        page: currentPage,
        pageSize: size,
        totalItems: results.length,
        totalPages,
        facets: {
          categories: CATEGORY_IDS.map((value) => ({
            value,
            label: CATEGORY_LABELS[value],
            count: all.filter((n) => n.category === value && matches(n, filters, 'category'))
              .length,
          })),
          networks: NETWORK_IDS.map((value) => ({
            value,
            label: NETWORK_LABELS[value],
            count: all.filter((n) => n.network === value && matches(n, filters, 'network')).length,
          })),
          priceRange: { min: prices[0] ?? '0.00', max: prices[prices.length - 1] ?? '0.00' },
        },
      })
    },
  ),

  http.get<PathParams, DefaultBodyType, FeaturedResponse | ApiErrorBody>(
    apiUrl('/featured'),
    async () => {
      await simulateNetwork()
      const heroImages = [LARGE_ART.emerald]
      const hero = FEATURED_IDS.hero
        .map((id, index) => {
          const nft = db.findNft(id)
          return nft ? { nft: toSummary(nft), image: heroImages[index] ?? nft.image } : null
        })
        .filter((item) => item !== null)
      const spotlight = db.findNft(FEATURED_IDS.spotlight)
      if (!spotlight || hero.length === 0) {
        return errorResponse(500, 'INTERNAL_ERROR', 'Destaques indisponíveis.')
      }
      return HttpResponse.json<FeaturedResponse>({
        hero,
        spotlight: { nft: toSummary(spotlight), image: LARGE_ART.sagePortrait },
      })
    },
  ),

  http.get<{ nftId: string }, DefaultBodyType, NftDetail | ApiErrorBody>(
    apiUrl('/nfts/:nftId'),
    async ({ params }) => {
      await simulateNetwork()
      const nft = db.findNft(String(params.nftId))
      if (!nft) return errorResponse(404, 'NOT_FOUND', 'NFT não encontrado.')
      return HttpResponse.json<NftDetail>(toDetail(nft))
    },
  ),
]
