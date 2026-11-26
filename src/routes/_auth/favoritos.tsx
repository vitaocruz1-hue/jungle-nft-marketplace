import { createFileRoute, Link } from '@tanstack/react-router'
import { HeartIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { QueryError } from '@/components/query-error'
import { Button } from '@/components/ui/button'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { useFavoritesList } from '@/features/favorites/queries'
import { ProfileLayout } from '@/features/profile/components/profile-layout'

export const Route = createFileRoute('/_auth/favoritos')({
  head: () => ({ meta: [{ title: 'Favoritos · Kurio' }] }),
  component: FavoritesPage,
})

/** Mesma grade do catálogo (no celular, coluna da direita desencontrada). */
const gridClass =
  'grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-6 md:grid-cols-3 md:gap-y-8 max-md:[&>*:nth-child(even)]:mt-8'

function countLabel(count: number) {
  return count === 1 ? '1 NFT favoritado' : `${count} NFTs favoritados`
}

function FavoritesPage() {
  const query = useFavoritesList()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const count = query.data?.items.length

  // Ao desfavoritar, o card some junto com o botão focado: o foco vai para o título.
  const previousCount = useRef(count)
  useEffect(() => {
    const removed = count !== undefined && count < (previousCount.current ?? 0)
    const focusLost = !document.activeElement || document.activeElement === document.body
    if (removed && focusLost) headingRef.current?.focus()
    previousCount.current = count
  }, [count])

  return (
    <ProfileLayout menuOnMobile={false}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
          Favoritos
        </h1>
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {count !== undefined && count > 0 ? countLabel(count) : ''}
        </p>
      </div>

      <div className="mt-6">
        {query.isPending ? (
          <div aria-busy="true" aria-label="Carregando favoritos" className={gridClass}>
            {Array.from({ length: 6 }, (_, i) => (
              <NftCardSkeleton key={i} />
            ))}
          </div>
        ) : query.isError ? (
          <QueryError
            title="Não foi possível carregar seus favoritos"
            error={query.error}
            onRetry={() => void query.refetch()}
            isRetrying={query.isFetching}
          />
        ) : query.data.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md bg-card px-6 py-12 text-center">
            <HeartIcon aria-hidden="true" className="size-8 text-highlight" />
            <p className="text-lg font-bold">Você ainda não favoritou nenhum NFT</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Toque no coração de um NFT para guardá-lo aqui.
            </p>
            <Button asChild className="mt-2">
              <Link to="/" hash="catalogo">
                Explorar NFTs
              </Link>
            </Button>
          </div>
        ) : (
          <ul aria-label="Seus favoritos" className={gridClass}>
            {query.data.items.map((nft, index) => (
              <li key={nft.id}>
                <NftCard nft={nft} priority={index < 3} favoriteButton="always" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </ProfileLayout>
  )
}
