import type { EthAmount, Paginated } from './common'

export const CATEGORY_IDS = [
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'memberships',
  'utility',
] as const
export type CategoryId = (typeof CATEGORY_IDS)[number]

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  '3d-art': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  gaming: 'Jogos',
  memberships: 'Assinaturas',
  utility: 'Utilidade',
}

export const NETWORK_IDS = ['ethereum', 'polygon', 'solana'] as const
export type NetworkId = (typeof NETWORK_IDS)[number]

export const NETWORK_LABELS: Record<NetworkId, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

/** Abas do catálogo: todos, novos lançamentos, em alta. */
export const CATALOG_TABS = ['all', 'new', 'trending'] as const
export type CatalogTab = (typeof CATALOG_TABS)[number]

export const CATALOG_SORTS = ['recent', 'price-asc', 'price-desc', 'name-asc'] as const
export type CatalogSort = (typeof CATALOG_SORTS)[number]

export interface NftImage {
  src: string
  alt: string
  width: number
  height: number
}

/** NFT como aparece em listas (catálogo, destaques, "mais desta coleção"). */
export interface NftSummary {
  id: string
  name: string
  image: NftImage
  /** Menor preço entre as edições com estoque. */
  price: EthAmount
  /** Preço anterior, quando o NFT está em promoção. */
  compareAtPrice: EthAmount | null
  category: CategoryId
  network: NetworkId
  /** Todas as edições esgotadas. */
  soldOut: boolean
  /** Aumenta a cada mudança de preço/estoque (usado para ordenar eventos). */
  version: number
}

export interface NftEdition {
  id: string
  /** Ex.: "1/1", "1/10", "1/50", "Aberta". */
  label: string
  /** Tiragem total; null = edição aberta. */
  supply: number | null
  /** Unidades ainda disponíveis para compra. */
  available: number
  price: EthAmount
  /** Limite de unidades por pedido. */
  maxPerOrder: number
}

export interface NftDetail extends NftSummary {
  tokenId: string
  collection: { id: string; name: string }
  creator: string
  description: string
  /** Parágrafos da aba "Detalhes do NFT". */
  story: string[]
  attributes: string[]
  rating: number
  reviewCount: number
  royaltyPercent: number
  contractAddress: string
  gallery: NftImage[]
  editions: NftEdition[]
}

/** Parâmetros de GET /api/nfts. */
export interface NftListParams {
  search?: string
  category?: CategoryId
  network?: NetworkId
  minPrice?: EthAmount
  maxPrice?: EthAmount
  tab?: CatalogTab
  sort?: CatalogSort
  page?: number
  pageSize?: number
}

export interface FacetOption<T extends string> {
  value: T
  label: string
  /** Quantos resultados existiriam escolhendo esta opção (com os demais filtros). */
  count: number
}

/** Resposta de GET /api/nfts. */
export interface NftListResponse extends Paginated<NftSummary> {
  facets: {
    categories: FacetOption<CategoryId>[]
    networks: FacetOption<NetworkId>[]
    /** Faixa de preço de todo o catálogo (limites do controle de preço). */
    priceRange: { min: EthAmount; max: EthAmount }
  }
}

/** Um NFT em destaque, com a arte em tamanho maior que a do card. */
export interface FeaturedNft {
  nft: NftSummary
  image: NftImage
}

/** Resposta de GET /api/featured. */
export interface FeaturedResponse {
  /** Slides do carrossel da Início. */
  hero: FeaturedNft[]
  /** "NFT em destaque — oferta limitada". */
  spotlight: FeaturedNft
}
