import { SearchIcon } from 'lucide-react'
import { useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { NftImage } from '@/contracts/catalog'
import { cn } from '@/lib/utils'

/**
 * Galeria do detalhe: miniaturas + imagem principal + ampliação em diálogo.
 * Desktop: miniaturas à esquerda; celular: abaixo da imagem.
 */
export function NftGallery({ images, name }: { images: NftImage[]; name: string }) {
  const [selected, setSelected] = useState(0)
  const current = images[selected] ?? images[0]
  if (!current) return null

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row sm:gap-7">
      {images.length > 1 && (
        <ul aria-label="Imagens do NFT" className="flex gap-3 max-md:hidden sm:flex-col sm:gap-4">
          {images.map((image, index) => (
            <li key={image.src}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`Ver imagem ${index + 1} de ${images.length}: ${image.alt}`}
                aria-pressed={index === selected}
                className={cn(
                  'block size-20 cursor-pointer overflow-hidden rounded-md border-2 transition-colors sm:size-[100px]',
                  index === selected
                    ? 'border-primary'
                    : 'border-transparent hover:border-primary/50',
                )}
              >
                <img
                  src={image.src}
                  alt=""
                  width={image.width}
                  height={image.height}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative flex-1 rounded-md bg-card p-4 max-md:bg-transparent max-md:p-0 sm:max-w-[444px] md:p-5">
        <img
          key={current.src}
          src={current.src}
          alt={current.alt}
          width={current.width}
          height={current.height}
          fetchPriority="high"
          decoding="async"
          className="aspect-square w-full rounded-[20px] object-cover max-md:rounded-3xl"
        />
        {/* Celular: pontos sobre a imagem trocam a foto da galeria. */}
        {images.length > 1 && (
          <div
            role="group"
            aria-label="Imagens do NFT"
            className="absolute inset-x-0 bottom-10 flex justify-center gap-1 md:hidden"
          >
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`Ver imagem ${index + 1} de ${images.length}: ${image.alt}`}
                aria-pressed={index === selected}
                className="grid size-6 cursor-pointer place-items-center rounded-full"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'block size-2 rounded-full bg-background/80 ring-1 ring-primary',
                    index === selected && 'bg-primary',
                  )}
                />
              </button>
            ))}
          </div>
        )}
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Ampliar imagem"
              className="absolute top-3 right-3 grid size-9 cursor-pointer place-items-center rounded-full bg-background/90 transition-colors hover:bg-background max-md:hidden"
            >
              <SearchIcon className="size-5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[min(92vw,720px)] p-3 sm:max-w-[min(92vw,720px)]">
            <DialogTitle className="sr-only">{name}</DialogTitle>
            <DialogDescription className="sr-only">{current.alt}</DialogDescription>
            <img
              src={current.src}
              alt={current.alt}
              width={current.width}
              height={current.height}
              className="w-full rounded-md"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
