import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, notFound, type ErrorComponentProps } from '@tanstack/react-router'
import { MailIcon, StarIcon } from 'lucide-react'

import { LinkedinIcon, TwitterIcon } from '@/components/brand-icons'
import { BackButton } from '@/components/back-button'
import { Breadcrumb } from '@/components/breadcrumb'
import { Container } from '@/components/layout/container'
import { NotFound } from '@/components/not-found'
import { RouteError } from '@/components/route-error'
import { RatingStars } from '@/components/rating-stars'
import { nftDetailQueryOptions, relatedNftsQueryOptions } from '@/features/catalog/queries'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { NftDetailSkeleton } from '@/features/nft-detail/components/nft-detail-skeleton'
import { NftGallery } from '@/features/nft-detail/components/nft-gallery'
import { NftTabs } from '@/features/nft-detail/components/nft-tabs'
import { PurchasePanel } from '@/features/nft-detail/components/purchase-panel'
import { RelatedNfts } from '@/features/nft-detail/components/related-nfts'
import { useLiveNft } from '@/features/realtime/realtime-store'
import { ApiError } from '@/lib/api-error'
import { displayEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/nft/$nftId')({
  loader: async ({ context: { queryClient }, params }) => {
    try {
      const nft = await queryClient.ensureQueryData(nftDetailQueryOptions(params.nftId))
      // Recomendações só depois de saber que o NFT existe (evita um 404 inútil).
      void queryClient.prefetchQuery(relatedNftsQueryOptions(params.nftId))
      return { name: nft.name }
    } catch (error) {
      // Acesso direto a um NFT que não existe → 404 específica.
      if (error instanceof ApiError && error.code === 'NOT_FOUND') throw notFound()
      throw error
    }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.name} · Kurio` : 'NFT · Kurio' }],
  }),
  // Skeleton logo no início do carregamento (e por pelo menos 300ms, sem "piscar").
  pendingComponent: NftDetailSkeleton,
  pendingMs: 150,
  pendingMinMs: 300,
  notFoundComponent: () => (
    <Container>
      <NotFound
        title="NFT não encontrado"
        description="Este NFT não existe ou foi removido do mercado."
      />
    </Container>
  ),
  errorComponent: DetailError,
  component: NftDetailPage,
})

function DetailError(props: ErrorComponentProps) {
  return (
    <Container>
      <RouteError {...props} title="Não foi possível carregar este NFT" />
    </Container>
  )
}

function ShareLinks({ name }: { name: string }) {
  const url = typeof window === 'undefined' ? '' : window.location.href
  const text = `${name} na Kurio`
  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: <LinkedinIcon className="size-4" />,
    },
    {
      label: 'e-mail',
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
      icon: <MailIcon aria-hidden="true" className="size-4" />,
    },
    {
      label: 'Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: <TwitterIcon className="size-4" />,
    },
  ]
  return (
    <p className="flex items-center gap-3 text-sm font-bold">
      Compartilhar este NFT:
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target={link.href.startsWith('mailto') ? undefined : '_blank'}
          rel="noopener noreferrer"
          aria-label={`Compartilhar por ${link.label}`}
          className="rounded-sm hover:text-highlight"
        >
          {link.icon}
        </a>
      ))}
    </p>
  )
}

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const { data: nft } = useSuspenseQuery(nftDetailQueryOptions(nftId))
  const priceFlash = useLiveNft(nft.id)

  return (
    <Container className="max-md:pb-48 md:pt-8">
      <div className="max-md:hidden">
        <Breadcrumb
          items={[
            { label: 'Início', link: { to: '/' } },
            { label: 'Mercado', link: { to: '/', hash: 'catalogo' } },
            { label: nft.name },
          ]}
        />
      </div>
      {/* Celular (Figma mobile): voltar e favoritar no topo. */}
      <div className="flex items-center justify-between pt-4 pb-4 md:hidden">
        <BackButton />
        <FavoriteButton nftId={nft.id} className="size-9" />
      </div>

      <div className="grid gap-8 max-md:gap-0 md:mt-3 lg:grid-cols-[572px_minmax(0,1fr)]">
        <NftGallery key={nft.id} images={nft.gallery} name={nft.name} />

        <article
          aria-labelledby="nft-titulo"
          className="min-w-0 max-md:relative max-md:z-10 max-md:-mx-5 max-md:-mt-8 max-md:rounded-t-[28px] max-md:bg-card max-md:px-6 max-md:pt-7 max-md:pb-6"
        >
          <div className="flex items-start justify-between gap-3">
            <h1 id="nft-titulo" className="type-display max-md:type-heading">
              {nft.name}
            </h1>
            <p className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-2 py-0.5 text-sm md:hidden">
              <StarIcon aria-hidden="true" className="size-3.5 fill-primary text-primary" />
              <span className="sr-only">Nota</span>
              <strong>{nft.rating.toFixed(1)}</strong>
              <span>
                ({nft.reviewCount}
                <span className="sr-only"> avaliações</span>)
              </span>
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-b border-[#442c1a] pb-3 max-md:hidden">
            <p className="text-xl font-bold text-highlight">
              <span className="sr-only">A partir de </span>
              <span className={cn(priceFlash && 'price-flash')}>{displayEth(nft.price)}</span>
              {nft.compareAtPrice && (
                <span className="ml-3 text-base font-normal text-muted-foreground line-through">
                  <span className="sr-only">Preço anterior: </span>
                  {displayEth(nft.compareAtPrice)}
                </span>
              )}
            </p>
            <p className="flex items-center gap-2 text-sm">
              <RatingStars rating={nft.rating} />
              {nft.reviewCount} avaliações de colecionadores
            </p>
          </div>

          <h2 className="mt-5 type-body font-bold max-md:sr-only">Sobre este NFT:</h2>
          <p className="mt-2 measure type-body text-muted-foreground">{nft.description}</p>

          <div className="mt-4">
            <PurchasePanel key={nft.id} nft={nft} />
          </div>

          <dl className="mt-6 space-y-2 type-body text-muted-foreground">
            <div className="flex gap-1">
              <dt className="font-bold text-foreground">ID do token:</dt>
              <dd>{nft.tokenId}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="font-bold text-foreground">Coleção:</dt>
              <dd>{nft.collection.name}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="font-bold text-foreground">Atributos:</dt>
              <dd>{nft.attributes.join(', ')}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <ShareLinks name={nft.name} />
          </div>
        </article>
      </div>

      <NftTabs nft={nft} />
      <RelatedNfts nftId={nft.id} />
    </Container>
  )
}
