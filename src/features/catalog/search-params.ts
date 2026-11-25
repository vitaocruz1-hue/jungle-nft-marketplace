import { z } from 'zod'

import {
  CATALOG_SORTS,
  CATALOG_TABS,
  CATEGORY_IDS,
  NETWORK_IDS,
  type NftListParams,
} from '@/contracts/catalog'

export const CATALOG_PAGE_SIZE = 9

const priceSchema = z.number().nonnegative().max(1_000_000)

/**
 * Estado do catálogo guardado na URL (?search=…&category=…&page=2).
 * Valores inválidos digitados à mão viram o padrão em vez de quebrar a tela.
 */
export const catalogSearchSchema = z.object({
  search: z.coerce.string().trim().max(80).optional().catch(undefined),
  category: z.enum(CATEGORY_IDS).optional().catch(undefined),
  network: z.enum(NETWORK_IDS).optional().catch(undefined),
  minPrice: priceSchema.optional().catch(undefined),
  maxPrice: priceSchema.optional().catch(undefined),
  tab: z.enum(CATALOG_TABS).default('all').catch('all'),
  sort: z.enum(CATALOG_SORTS).default('recent').catch('recent'),
  page: z.number().int().min(1).default(1).catch(1),
})

export type CatalogSearch = z.output<typeof catalogSearchSchema>

/** Valores padrão: não aparecem na URL. */
export const CATALOG_SEARCH_DEFAULTS = {
  tab: 'all',
  sort: 'recent',
  page: 1,
} as const satisfies Partial<CatalogSearch>

/** Converte o estado da URL nos parâmetros da API (preços viram string decimal). */
export function toListParams(search: CatalogSearch): NftListParams {
  return {
    search: search.search || undefined,
    category: search.category,
    network: search.network,
    minPrice: search.minPrice?.toFixed(2),
    maxPrice: search.maxPrice?.toFixed(2),
    tab: search.tab,
    sort: search.sort,
    page: search.page,
    pageSize: CATALOG_PAGE_SIZE,
  }
}

export function hasActiveFilters(search: CatalogSearch) {
  return Boolean(
    search.search ||
    search.category ||
    search.network ||
    search.minPrice !== undefined ||
    search.maxPrice !== undefined ||
    search.tab !== 'all',
  )
}
