import { useNavigate, useRouterState } from '@tanstack/react-router'
import { toast } from 'sonner'

import { useSession } from '@/features/auth/session'

import { useFavorites, useToggleFavorite } from './queries'

/**
 * Favoritar a partir de qualquer lugar (card, detalhe). Sem login, explica e
 * leva ao login, voltando depois para a página atual.
 */
export function useFavoriteAction(nftId: string) {
  const navigate = useNavigate()
  const href = useRouterState({ select: (s) => s.location.href })
  const { isAuthenticated } = useSession()
  const { isFavorite } = useFavorites()
  const toggle = useToggleFavorite()
  const favorite = isFavorite(nftId)

  function toggleFavorite() {
    if (!isAuthenticated) {
      toast.info('Entre na sua conta para favoritar NFTs.')
      void navigate({ to: '/login', search: { redirect: href } })
      return
    }
    toggle.mutate({ nftId, favorite: !favorite })
  }

  return { favorite, toggleFavorite, isAuthenticated, isPending: toggle.isPending }
}
