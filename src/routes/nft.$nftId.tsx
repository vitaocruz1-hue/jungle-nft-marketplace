import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { MailIcon } from 'lucide-react'

import { LinkedinIcon, TwitterIcon } from '@/components/brand-icons'
import { Breadcrumb } from '@/components/breadcrumb'
import { Container } from '@/components/layout/container'
import { NotFound } from '@/components/not-found'
import { QueryError } from '@/components/query-error'
import { RatingStars } from '@/components/rating-stars'
import { nftDetailQueryOptions, relatedNftsQueryOptions } from '@/features/catalog/queries'
import { NftDetailSkeleton } from '@/features/nft-detail/components/nft-detail-skeleton'
import { NftGallery } from '@/features/nft-detail/components/nft-gallery'
import { NftTabs } from '@/features/nft-detail/components/nft-tabs'
import { PurchasePanel } from '@/features/nft-detail/components/purchase-panel'
import { RelatedNfts } from '@/features/nft-detail/components/related-nfts'
import { ApiError } from '@/lib/api-error'
import { displayEth } from '@/lib/eth'

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

function DetailError({ error }: { error: unknown }) {
  const router = useRouter()
  return (
    <Container className="py-16">
      <QueryError
        title="Não foi possível carregar este NFT"
        error={error}
        onRetry={() => void router.invalidate()}
      />
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

  return (
    <Container className="pt-8">
      <Breadcrumb
        items={[
          { label: 'Início', link: { to: '/' } },
          { label: 'Mercado', link: { to: '/', hash: 'catalogo' } },
          { label: nft.name },
        ]}
      />

      <div className="mt-3 grid gap-8 lg:grid-cols-[572px_minmax(0,1fr)]">
        <NftGallery key={nft.id} images={nft.gallery} name={nft.name} />

        <article aria-labelledby="nft-titulo" className="min-w-0">
          <h1 id="nft-titulo" className="text-2xl font-bold sm:text-[28px]">
            {nft.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-b border-[#442c1a] pb-3">
            <p className="text-xl font-bold text-highlight">
              <span className="sr-only">A partir de </span>
              {displayEth(nft.price)}
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

          <h2 className="mt-4 text-sm font-bold">Sobre este NFT:</h2>
          <p className="mt-2 text-sm leading-[22px] text-muted-foreground">{nft.description}</p>

          <div className="mt-4">
            <PurchasePanel key={nft.id} nft={nft} />
          </div>

          <dl className="mt-6 space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <dt>ID do token:</dt>
              <dd>{nft.tokenId}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Coleção:</dt>
              <dd>{nft.collection.name}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Atributos:</dt>
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
