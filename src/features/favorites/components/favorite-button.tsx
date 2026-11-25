import { HeartIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { useFavoriteAction } from '../use-favorite-action'

interface FavoriteButtonProps {
  nftId: string
  /** Nome acessível; por padrão "Favoritar"/"Favoritado". */
  label?: { add: string; remove: string }
  className?: string
}

/** Botão redondo de coração (cards e detalhe no celular). */
export function FavoriteButton({ nftId, label, className }: FavoriteButtonProps) {
  const { favorite, toggleFavorite, isAuthenticated } = useFavoriteAction(nftId)
  const name = favorite ? (label?.remove ?? 'Favoritado') : (label?.add ?? 'Favoritar')

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-label={name}
      aria-pressed={isAuthenticated ? favorite : undefined}
      className={cn(
        'grid size-8 cursor-pointer place-items-center rounded-full bg-[#2f1d15]/85 text-highlight backdrop-blur-sm transition-colors hover:bg-[#2f1d15]',
        className,
      )}
    >
      <HeartIcon aria-hidden="true" className={cn('size-4', favorite && 'fill-primary')} />
    </button>
  )
}
