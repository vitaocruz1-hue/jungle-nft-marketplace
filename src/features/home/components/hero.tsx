import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { FeaturedNft } from '@/contracts/catalog'
import { featuredQueryOptions } from '@/features/catalog/queries'
import { cn } from '@/lib/utils'

/**
 * Destaques da Início: texto fixo + carrossel de NFTs vindos da API.
 * Sem rotação automática (exigiria controle de pausa para acessibilidade).
 * Ordem no celular: texto → imagem → seletor; a partir de 768px, 2 colunas.
 */
export function Hero() {
  const { data } = useQuery(featuredQueryOptions())
  const [current, setCurrent] = useState(0)
  const slides = data?.hero ?? []
  const slide = slides[current] ?? slides[0]

  return (
    <>
      <MobileHero slides={slides} current={current} onSelect={setCurrent} />
      <section
        aria-labelledby="hero-titulo"
        className="grid items-center gap-x-10 gap-y-8 pt-8 max-md:hidden md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_450px] lg:grid-rows-[355px_minmax(0,1fr)] lg:gap-x-12"
      >
        <div className="md:col-start-1 md:row-start-1 md:self-end lg:pl-10">
          <p className="type-body tracking-[0.12em]">Bem-vindo à Kurio</p>
          <h1
            id="hero-titulo"
            className="mt-2 text-[28px] leading-tight font-bold uppercase sm:text-4xl md:text-[30px] lg:text-[43px]"
          >
            Seja dono do futuro <br className="hidden sm:block" />
            da arte digital
          </h1>
          <p className="mt-3 max-w-[560px] type-body text-muted-foreground">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
            rara, apoie artistas e tenha uma parte da cultura da internet.
          </p>
          <Button asChild size="lg" className="mt-6 h-10 w-[140px] text-base font-bold uppercase">
            <Link to="/" hash="catalogo">
              Explorar
            </Link>
          </Button>
        </div>

        <div className="mx-auto w-full max-w-[450px] md:col-start-2 md:row-span-2 md:row-start-1">
          {slide ? (
            <Link
              to="/nft/$nftId"
              params={{ nftId: slide.nft.id }}
              className="block rounded-[20px]"
              aria-label={`Ver destaque: ${slide.nft.name}`}
            >
              <img
                key={slide.nft.id}
                src={slide.image.src}
                alt={slide.image.alt}
                width={slide.image.width}
                height={slide.image.height}
                fetchPriority="high"
                decoding="async"
                className="aspect-square w-full rounded-[20px] object-cover motion-safe:animate-in motion-safe:fade-in"
              />
            </Link>
          ) : (
            <Skeleton className="aspect-square w-full rounded-[20px]" />
          )}
        </div>

        <div
          role="group"
          aria-label="Escolher destaque"
          className={cn(
            'flex min-h-6 justify-center gap-2 md:col-start-1 md:row-start-2 md:justify-end md:self-start lg:mt-1 lg:mr-[46px] lg:gap-0',
            slides.length <= 1 && 'invisible',
          )}
        >
          {slides.map((item, index) => (
            <button
              key={item.nft.id}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Destaque ${index + 1} de ${slides.length}: ${item.nft.name}`}
              aria-pressed={index === current}
              className="grid size-6 cursor-pointer place-items-center rounded-full"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'block size-2 rounded-full bg-primary transition-opacity',
                  index !== current && 'opacity-50',
                )}
              />
            </button>
          ))}
        </div>
      </section>
    </>
  )
}

type Slides = FeaturedNft[]

/** Destaque no celular (Figma mobile): card com texto, arte principal e uma menor. */
function MobileHero({
  slides,
  current,
  onSelect,
}: {
  slides: Slides
  current: number
  onSelect: (index: number) => void
}) {
  const slide = slides[current] ?? slides[0]
  const next = slides[(current + 1) % Math.max(slides.length, 1)]

  return (
    <section aria-labelledby="hero-titulo-mobile" className="mt-4 md:hidden">
      <div className="relative overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_72%_28%,#8d7051_0%,#5a3c24_34%,#33211a_62%,#2a1a14_100%)] p-4">
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <p className="type-caption">Bem-vindo à Kurio</p>
            <h1
              id="hero-titulo-mobile"
              className="mt-1.5 text-[18px] leading-tight font-bold uppercase"
            >
              Seja dono da cultura digital
            </h1>
            <p className="mt-2 type-body text-muted-foreground">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>
            <Link
              to="/"
              hash="catalogo"
              className="mt-3 inline-flex items-center gap-2 text-[13px] font-bold text-highlight uppercase"
            >
              Explorar <ArrowRightIcon aria-hidden="true" className="size-4" />
            </Link>
          </div>
          <div className="relative w-[132px] shrink-0 self-center">
            {slide ? (
              <Link
                to="/nft/$nftId"
                params={{ nftId: slide.nft.id }}
                aria-label={`Ver destaque: ${slide.nft.name}`}
                className="block rounded-2xl"
              >
                <img
                  key={slide.nft.id}
                  src={slide.image.src}
                  alt={slide.image.alt}
                  width={slide.image.width}
                  height={slide.image.height}
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-square w-full rounded-2xl object-cover"
                />
              </Link>
            ) : (
              <Skeleton className="aspect-square w-full rounded-2xl" />
            )}
            {next && next !== slide && (
              <img
                src={next.nft.image.src}
                alt=""
                width={next.nft.image.width}
                height={next.nft.image.height}
                loading="lazy"
                decoding="async"
                className="absolute -bottom-2 -left-5 size-[58px] rounded-xl border-2 border-[#33211a] object-cover"
              />
            )}
          </div>
        </div>
        <div role="group" aria-label="Escolher destaque" className="mt-2 flex justify-center gap-1">
          {slides.map((item, index) => (
            <button
              key={item.nft.id}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Destaque ${index + 1} de ${slides.length}: ${item.nft.name}`}
              aria-pressed={index === current}
              className="grid size-6 cursor-pointer place-items-center rounded-full"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'block size-1.5 rounded-full bg-primary',
                  index === current ? 'scale-125' : 'opacity-60',
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
