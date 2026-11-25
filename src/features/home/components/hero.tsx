import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
    <section
      aria-labelledby="hero-titulo"
      className="grid items-center gap-x-10 gap-y-8 pt-8 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_450px] lg:gap-x-12"
    >
      <div className="md:col-start-1 md:row-start-1 md:self-end lg:pl-10">
        <p className="text-sm tracking-[0.12em]">Bem-vindo à Kurio</p>
        <h1
          id="hero-titulo"
          className="mt-5 text-[28px] leading-[1.35] font-bold uppercase sm:text-4xl md:text-[30px] lg:text-[44px] lg:leading-[70px]"
        >
          Seja dono do futuro <br className="hidden sm:block" />
          da arte digital
        </h1>
        <p className="mt-4 max-w-[560px] text-sm leading-6 text-muted-foreground">
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
          rara, apoie artistas e tenha uma parte da cultura da internet.
        </p>
        <Button asChild size="lg" className="mt-10 h-10 w-[140px] text-base font-bold uppercase">
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
          'flex min-h-6 justify-center gap-2 md:col-start-1 md:row-start-2 md:justify-end md:self-start',
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
                'block size-2 rounded-full bg-primary transition-transform',
                index === current ? 'scale-125' : 'opacity-50',
              )}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
