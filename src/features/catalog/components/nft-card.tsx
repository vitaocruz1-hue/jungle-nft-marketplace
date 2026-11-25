import { Link } from '@tanstack/react-router'

import { Skeleton } from '@/components/ui/skeleton'
import type { NftSummary } from '@/contracts/catalog'
import { displayEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

/** Card do catálogo: moldura 258×300 com a arte 250×250 ao centro (medidas do Figma). */
export function NftCard({ nft, priority = false }: { nft: NftSummary; priority?: boolean }) {
  return (
    <article className="group relative">
      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        className="block rounded-sm focus-visible:outline-offset-4"
      >
        <div className="relative flex aspect-[258/300] items-center justify-center bg-card px-1">
          <img
            src={nft.image.src}
            alt={nft.image.alt}
            width={nft.image.width}
            height={nft.image.height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={cn(
              'aspect-square w-full rounded-[15px] object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.02]',
              nft.soldOut && 'opacity-60 grayscale-[40%]',
            )}
          />
          {nft.soldOut && (
            <span className="absolute top-3 left-3 rounded-sm bg-background/90 px-2 py-1 text-xs font-bold tracking-wide uppercase">
              Esgotado
            </span>
          )}
        </div>
        <h3 className="mt-3 truncate text-sm sm:text-base">{nft.name}</h3>
      </Link>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-base sm:text-lg">
        <span className={cn('font-bold', nft.soldOut ? 'text-muted-foreground' : 'text-highlight')}>
          <span className="sr-only">Preço: </span>
          {displayEth(nft.price)}
        </span>
        {nft.compareAtPrice && (
          <span className="text-muted-foreground line-through">
            <span className="sr-only">Preço anterior: </span>
            {displayEth(nft.compareAtPrice)}
          </span>
        )}
      </p>
    </article>
  )
}

/** Mesmo tamanho do card real: a página não "pula" quando os dados chegam. */
export function NftCardSkeleton() {
  return (
    <div>
      <div className="flex aspect-[258/300] items-center justify-center bg-card px-1">
        <Skeleton className="aspect-square w-full rounded-[15px] bg-card" />
      </div>
      <Skeleton className="mt-3 h-5 w-3/4" />
      <Skeleton className="mt-2 h-6 w-1/3" />
    </div>
  )
}
