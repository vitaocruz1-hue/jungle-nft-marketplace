import type { NftDetail, NftSummary } from '@/contracts/catalog'
import { compareEth, formatWei, parseEth } from '@/lib/eth'

import type { NftRecord } from '../db/fixtures/nfts'

/** Preço exibido = menor preço entre as edições com estoque. */
export function currentPrice(nft: NftRecord): string {
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
