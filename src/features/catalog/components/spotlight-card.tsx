import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { featuredQueryOptions } from '../queries'

/** "NFT em destaque — oferta limitada" (coluna lateral da Início). */
export function SpotlightCard({ className }: { className?: string }) {
  const { data, isError } = useQuery(featuredQueryOptions())

  // Conteúdo promocional: se falhar, some sem atrapalhar o catálogo.
  if (isError) return null

  return (
    <section aria-labelledby="destaque-titulo" className={cn('bg-[#271a11] pt-12', className)}>
      <div className="px-5">
        <h2
          id="destaque-titulo"
          className="text-2xl leading-tight font-bold text-highlight uppercase"
        >
          NFT em destaque
        </h2>
        <p className="mt-2 text-center type-heading uppercase">Oferta limitada</p>
      </div>
      {data ? (
        <Link
          to="/nft/$nftId"
          params={{ nftId: data.spotlight.nft.id }}
          className="mt-3 block rounded-[20px]"
        >
          <span className="sr-only">Ver {data.spotlight.nft.name}</span>
          <img
            src={data.spotlight.image.src}
            alt={data.spotlight.image.alt}
            width={data.spotlight.image.width}
            height={data.spotlight.image.height}
            loading="lazy"
            decoding="async"
            className="aspect-[616/728] w-full rounded-[20px] object-cover"
          />
        </Link>
      ) : (
        <Skeleton className="mt-3 aspect-[616/728] w-full rounded-[20px]" />
      )}
    </section>
  )
}
