import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { CatalogSearch } from '@/features/catalog/search-params'

interface Banner {
  title: string
  text: string
  image: { src: string; alt: string }
  search: Partial<CatalogSearch>
}

const BANNERS: Banner[] = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: { src: '/images/nfts/emerald-ape.webp', alt: '' },
    search: { tab: 'new' },
  },
  {
    title: 'Arte digital selecionada e muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: { src: '/images/nfts/neon-vessel.webp', alt: '' },
    search: { category: 'digital-art' },
  },
]

/** Os dois banners da Início: levam ao catálogo já filtrado. */
export function PromoBanners() {
  return (
    <section
      aria-label="Coleções em destaque"
      className="mt-20 grid gap-6 lg:mt-[94px] lg:grid-cols-2 lg:gap-[29px]"
    >
      {BANNERS.map((banner) => (
        <article
          key={banner.title}
          className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] items-stretch overflow-hidden rounded-[15px] bg-card lg:h-[250px] lg:grid-cols-[287px_minmax(0,1fr)]"
        >
          <img
            src={banner.image.src}
            alt={banner.image.alt}
            width={496}
            height={496}
            loading="lazy"
            decoding="async"
            className="h-full min-h-[180px] w-full rounded-[15px] object-cover"
          />
          <div className="flex flex-col items-end justify-center gap-3 p-4 text-right sm:p-6 lg:gap-2 lg:py-4 lg:pr-[31px] lg:pl-1">
            <h2 className="text-sm leading-snug font-bold sm:text-[17px] lg:text-lg lg:leading-6">
              {banner.title}
            </h2>
            <p className="text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
              {banner.text}
            </p>
            <Button
              asChild
              className="mt-1 h-10 px-5 text-sm sm:text-base lg:-mt-1.5 lg:px-6 lg:text-sm"
            >
              <Link to="/" search={banner.search} hash="catalogo">
                Explorar <ArrowRightIcon aria-hidden="true" />
                <span className="sr-only">: {banner.title}</span>
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </section>
  )
}
