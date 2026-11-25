import { useQuery } from '@tanstack/react-query'

import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { relatedNftsQueryOptions } from '@/features/catalog/queries'

/** "Mais desta coleção": lista horizontal com rolagem (deslize no celular). */
export function RelatedNfts({
  nftId,
  title = 'Mais desta coleção',
}: {
  nftId: string
  title?: string
}) {
  const { data, isPending, isError } = useQuery(relatedNftsQueryOptions(nftId))

  // Conteúdo complementar: se falhar, a seção some sem afetar a compra.
  if (isError || (data && data.length === 0)) return null

  return (
    <section aria-labelledby="relacionados-titulo" className="mt-20">
      <h2
        id="relacionados-titulo"
        className="border-b border-[#442c1a] pb-3 text-base font-bold text-highlight"
      >
        {title}
      </h2>
      <ul
        aria-busy={isPending}
        className="mt-7 grid snap-x snap-mandatory auto-cols-[minmax(170px,1fr)] grid-flow-col gap-6 overflow-x-auto pb-4 sm:auto-cols-[minmax(195px,1fr)]"
      >
        {isPending
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i}>
                <NftCardSkeleton />
              </li>
            ))
          : data.map((nft) => (
              <li key={nft.id} className="snap-start">
                <NftCard nft={nft} />
              </li>
            ))}
      </ul>
    </section>
  )
}
