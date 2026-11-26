import type { NftSummary } from './catalog'

/** GET/PUT/DELETE /api/favorites[/:nftId] — exigem sessão. */
export interface FavoritesResponse {
  nftIds: string[]
  /** Os mesmos NFTs no formato dos cards do catálogo, do mais recente ao mais antigo. */
  items: NftSummary[]
}
