import { useNavigate, useRouterState } from '@tanstack/react-router'
import { HeartIcon, MinusIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import type { NftDetail, NftEdition } from '@/contracts/catalog'
import { useSession } from '@/features/auth/session'
import { useAddToCart } from '@/features/cart/queries'
import { useFavorites, useToggleFavorite } from '@/features/favorites/queries'
import { getErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'

/** Edição inicial: a mais barata com estoque (no Figma, a 1/50). */
function defaultEdition(editions: NftEdition[]) {
  const available = editions.filter((e) => e.available > 0)
  return available.find((e) => e.label === '1/50') ?? available[0] ?? editions[0]
}

function editionLimit(edition: NftEdition) {
  return Math.min(edition.available, edition.maxPerOrder)
}

function limitMessage(edition: NftEdition) {
  return edition.available < edition.maxPerOrder
    ? `Só ${edition.available === 1 ? 'resta 1 unidade' : `restam ${edition.available} unidades`} desta edição.`
    : `Limite de ${edition.maxPerOrder} por pedido nesta edição.`
}

export function PurchasePanel({ nft }: { nft: NftDetail }) {
  const navigate = useNavigate()
  const href = useRouterState({ select: (s) => s.location.href })
  const [editionId, setEditionId] = useState(() => defaultEdition(nft.editions)?.id)
  const [quantity, setQuantity] = useState(1)
  const addToCart = useAddToCart()
  const { isAuthenticated } = useSession()
  const { isFavorite } = useFavorites()
  const toggleFavorite = useToggleFavorite()

  // Se o estoque mudar (ex.: evento em tempo real), a seleção se ajusta.
  const edition = nft.editions.find((e) => e.id === editionId) ?? defaultEdition(nft.editions)
  const limit = edition ? editionLimit(edition) : 0
  const safeQuantity = Math.min(Math.max(quantity, 1), Math.max(limit, 1))
  const soldOut = !edition || edition.available === 0
  const favorite = isFavorite(nft.id)

  function selectEdition(next: NftEdition) {
    setEditionId(next.id)
    setQuantity((q) => Math.min(q, Math.max(editionLimit(next), 1)))
  }

  function buy() {
    if (!edition || soldOut) return
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity: safeQuantity },
      {
        onSuccess: () => {
          toast.success('Adicionado ao carrinho', {
            description: `${nft.name} · Edição ${edition.label} · ${safeQuantity} un.`,
          })
          void navigate({ to: '/carrinho' })
        },
        onError: (error) =>
          toast.error('Não foi possível adicionar ao carrinho', {
            description: getErrorMessage(error),
          }),
      },
    )
  }

  function handleFavorite() {
    if (!isAuthenticated) {
      toast.info('Entre na sua conta para favoritar NFTs.')
      void navigate({ to: '/login', search: { redirect: href } })
      return
    }
    toggleFavorite.mutate({ nftId: nft.id, favorite: !favorite })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 id="edicao-rotulo" className="text-sm font-bold">
          Edição:
        </h2>
        <div
          role="radiogroup"
          aria-labelledby="edicao-rotulo"
          className="mt-2 flex flex-wrap gap-2"
        >
          {nft.editions.map((option) => {
            const checked = option.id === edition?.id
            const unavailable = option.available === 0
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={checked}
                disabled={unavailable}
                onClick={() => selectEdition(option)}
                className={cn(
                  'min-w-11 cursor-pointer rounded-full border px-2.5 py-0.5 text-sm uppercase transition-colors',
                  checked
                    ? 'border-primary font-bold text-highlight'
                    : 'border-[#3d2a1f] text-muted-foreground hover:border-primary/60',
                  unavailable &&
                    'cursor-not-allowed line-through opacity-50 hover:border-[#3d2a1f]',
                )}
              >
                {option.label}
                {unavailable && <span className="sr-only"> (esgotada)</span>}
              </button>
            )
          })}
        </div>
        {edition && !soldOut && (
          <p className="mt-2 text-xs text-muted-foreground">
            {edition.supply === null
              ? 'Edição aberta'
              : `${edition.available} de ${edition.supply} disponíveis`}{' '}
            · máximo de {edition.maxPerOrder} por pedido
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            size="icon"
            className="h-10 w-8 rounded-full"
            aria-label="Diminuir quantidade"
            disabled={soldOut || safeQuantity <= 1}
            onClick={() => setQuantity(safeQuantity - 1)}
          >
            <MinusIcon className="size-5" />
          </Button>
          <output
            aria-live="polite"
            aria-label="Quantidade"
            className="min-w-4 text-center text-lg"
          >
            {soldOut ? 0 : safeQuantity}
          </output>
          <Button
            type="button"
            size="icon"
            className="h-10 w-8 rounded-full"
            aria-label="Aumentar quantidade"
            aria-describedby={safeQuantity >= limit ? 'limite-quantidade' : undefined}
            disabled={soldOut || safeQuantity >= limit}
            onClick={() => setQuantity(safeQuantity + 1)}
          >
            <PlusIcon className="size-5" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={buy}
            disabled={soldOut || addToCart.isPending}
            className="h-9 min-w-[115px] text-sm font-bold uppercase"
          >
            {soldOut ? 'Esgotado' : addToCart.isPending ? 'Adicionando…' : 'Comprar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleFavorite}
            aria-pressed={isAuthenticated ? favorite : undefined}
            className="h-9 border-primary bg-transparent text-sm text-highlight hover:bg-secondary hover:text-highlight"
          >
            <HeartIcon className={cn('size-5', favorite && 'fill-primary')} />
            {favorite ? 'Favoritado' : 'Favoritar'}
          </Button>
        </div>
      </div>

      {edition && !soldOut && safeQuantity >= limit && (
        <p id="limite-quantidade" role="status" className="text-xs text-highlight">
          {limitMessage(edition)}
        </p>
      )}
      {soldOut && (
        <p role="status" className="text-sm text-destructive">
          Todas as edições deste NFT estão esgotadas.
        </p>
      )}
    </div>
  )
}
