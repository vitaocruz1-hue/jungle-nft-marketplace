import { StarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/** Estrelas de 0 a 5. Leitores de tela ouvem "Nota 4,5 de 5". */
export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      <span className="sr-only">Nota {decimal.format(rating)} de 5</span>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          aria-hidden="true"
          className={cn(
            'size-3.5',
            i < Math.round(rating)
              ? 'fill-primary text-primary'
              : 'fill-muted-foreground/40 text-transparent',
          )}
        />
      ))}
    </span>
  )
}
