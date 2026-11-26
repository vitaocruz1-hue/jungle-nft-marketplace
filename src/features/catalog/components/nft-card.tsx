import { Link } from '@tanstack/react-router'

import { Skeleton } from '@/components/ui/skeleton'
import type { NftSummary } from '@/contracts/catalog'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { useLiveNft } from '@/features/realtime/realtime-store'
import { displayEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

interface NftCardProps {
  nft: NftSummary
  priority?: boolean
  /** No Figma o ♥ do card só existe no celular; na tela de favoritos aparece sempre. */
  favoriteButton?: 'mobile' | 'always'
}

/**
 * Card do catálogo. Desktop: moldura 258×300 com a arte 250×250 ao centro.
 * Celular (Figma mobile): moldura arredondada, ♥ sobre a arte.
 */
export function NftCard({ nft, priority = false, favoriteButton = 'mobile' }: NftCardProps) {
  const rare = nft.rarity === 'Raro' || nft.rarity === 'Épico'
  const priceFlash = useLiveNft(nft.id)

  return (
    <article className="nft-card group relative">
      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        className="block rounded-sm focus-visible:outline-offset-4"
      >
        <div className="nft-card-frame relative flex aspect-[258/300] items-center justify-center bg-card px-1 max-md:aspect-auto max-md:rounded-[20px] max-md:bg-[#2a1a14] max-md:px-1 max-md:pt-1 max-md:pb-4">
          {/* Zoom e reflexo (hover/foco) ficam dentro dos cantos arredondados. */}
          <div className="nft-card-art w-full">
            <img
              src={nft.image.src}
              alt={nft.image.alt}
              width={nft.image.width}
              height={nft.image.height}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              className={cn(
                'block aspect-square w-full rounded-[15px] object-cover',
                nft.soldOut && 'opacity-60 grayscale-[40%]',
              )}
            />
          </div>
          {rare && (
            <span className="absolute top-4 left-0 bg-primary px-2 py-1 text-xs font-bold text-primary-foreground uppercase">
              {nft.rarity}
            </span>
          )}
          {nft.soldOut && (
            <span className="absolute bottom-6 left-3 rounded-sm bg-background/90 px-2 py-1 text-xs font-bold tracking-wide uppercase max-md:bottom-7">
              Esgotado
            </span>
          )}
        </div>
        <h3 className="mt-3 truncate text-sm sm:text-base">{nft.name}</h3>
      </Link>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-base sm:text-lg">
        <span
          className={cn(
            'font-bold',
            nft.soldOut ? 'text-muted-foreground' : 'text-highlight',
            priceFlash && 'price-flash',
          )}
        >
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
      <FavoriteButton
        nftId={nft.id}
        label={{
          add: `Adicionar ${nft.name} aos favoritos`,
          remove: `Remover ${nft.name} dos favoritos`,
        }}
        className={cn(
          'absolute top-2.5 right-2.5',
          favoriteButton === 'mobile' && 'md:hidden',
          favoriteButton === 'always' && 'md:top-3 md:right-3',
        )}
      />
    </article>
  )
}

/** Mesmo tamanho do card real: a página não "pula" quando os dados chegam. */
export function NftCardSkeleton() {
  return (
    <div>
      <div className="flex aspect-[258/300] items-center justify-center bg-card px-1 max-md:aspect-auto max-md:rounded-[20px] max-md:px-1 max-md:pt-1 max-md:pb-4">
        <Skeleton className="aspect-square w-full rounded-[15px] bg-card" />
      </div>
      <Skeleton className="mt-3 h-5 w-3/4" />
      <Skeleton className="mt-2 h-6 w-1/3" />
    </div>
  )
}
