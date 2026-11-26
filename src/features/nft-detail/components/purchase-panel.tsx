import { useNavigate } from '@tanstack/react-router'
import { HeartIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import type { NftDetail, NftEdition } from '@/contracts/catalog'
import { useAddToCart } from '@/features/cart/queries'
import { useFavoriteAction } from '@/features/favorites/use-favorite-action'
import { useLiveNft } from '@/features/realtime/realtime-store'
import { getErrorMessage } from '@/lib/api-error'
import { displayEth, multiplyEth } from '@/lib/eth'
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

interface StepperProps {
  quantity: number
  disabled: boolean
  atLimit: boolean
  describedBy?: string
  onChange: (quantity: number) => void
  size: 'desktop' | 'mobile'
}

function QuantityStepper({
  quantity,
  disabled,
  atLimit,
  describedBy,
  onChange,
  size,
}: StepperProps) {
  const buttonClass = size === 'desktop' ? 'h-10 w-8 rounded-full' : 'h-7 w-5 rounded-full'
  const iconClass = size === 'desktop' ? 'size-5' : 'size-4'
  return (
    <div className={cn('flex items-center', size === 'desktop' ? 'gap-4' : 'gap-3')}>
      <Button
        type="button"
        size="icon"
        className={buttonClass}
        aria-label="Diminuir quantidade"
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(quantity - 1)}
      >
        <MinusIcon className={iconClass} />
      </Button>
      <output aria-live="polite" aria-label="Quantidade" className="min-w-4 text-center text-lg">
        {disabled ? 0 : quantity}
      </output>
      <Button
        type="button"
        size="icon"
        className={buttonClass}
        aria-label="Aumentar quantidade"
        aria-describedby={atLimit ? describedBy : undefined}
        disabled={disabled || atLimit}
        onClick={() => onChange(quantity + 1)}
      >
        <PlusIcon className={iconClass} />
      </Button>
    </div>
  )
}

export function PurchasePanel({ nft }: { nft: NftDetail }) {
  const navigate = useNavigate()
  const [editionId, setEditionId] = useState(() => defaultEdition(nft.editions)?.id)
  const [quantity, setQuantity] = useState(1)
  const addToCart = useAddToCart()
  const { favorite, toggleFavorite, isAuthenticated } = useFavoriteAction(nft.id)
  const priceFlash = useLiveNft(nft.id)

  // Se o estoque mudar (ex.: evento em tempo real), a seleção se ajusta.
  const edition = nft.editions.find((e) => e.id === editionId) ?? defaultEdition(nft.editions)
  const limit = edition ? editionLimit(edition) : 0
  const safeQuantity = Math.min(Math.max(quantity, 1), Math.max(limit, 1))
  const soldOut = !edition || edition.available === 0
  const atLimit = !soldOut && safeQuantity >= limit

  function selectEdition(next: NftEdition) {
    setEditionId(next.id)
    setQuantity((q) => Math.min(q, Math.max(editionLimit(next), 1)))
  }

  /** `goToCart`: "Comprar" leva ao carrinho; o botão de carrinho só adiciona. */
  function add(goToCart: boolean) {
    if (!edition || soldOut) return
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity: safeQuantity },
      {
        onSuccess: () => {
          const description = `${nft.name} · Edição ${edition.label} · ${safeQuantity} un.`
          if (goToCart) {
            toast.success('Adicionado ao carrinho', { description })
            void navigate({ to: '/carrinho' })
          } else {
            toast.success('Adicionado ao carrinho', {
              description,
              action: { label: 'Ver carrinho', onClick: () => void navigate({ to: '/carrinho' }) },
            })
          }
        },
        onError: (error) =>
          toast.error('Não foi possível adicionar ao carrinho', {
            description: getErrorMessage(error),
          }),
      },
    )
  }

  const stepper = {
    quantity: safeQuantity,
    disabled: soldOut,
    atLimit,
    onChange: setQuantity,
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

      {/* Desktop/tablet: quantidade + Comprar + Favoritar na mesma linha. */}
      <div className="flex flex-wrap items-center justify-between gap-4 max-md:hidden">
        <QuantityStepper {...stepper} size="desktop" describedBy="limite-quantidade" />
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => add(true)}
            disabled={soldOut || addToCart.isPending}
            className="h-9 min-w-[115px] text-sm font-bold uppercase"
          >
            {soldOut ? 'Esgotado' : addToCart.isPending ? 'Adicionando…' : 'Comprar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={toggleFavorite}
            aria-pressed={isAuthenticated ? favorite : undefined}
            className="h-9 border-primary bg-transparent text-sm text-highlight hover:bg-secondary hover:text-highlight"
          >
            <HeartIcon className={cn('size-5', favorite && 'fill-primary')} />
            {favorite ? 'Favoritado' : 'Favoritar'}
          </Button>
        </div>
      </div>

      {atLimit && edition && (
        <p id="limite-quantidade" role="status" className="text-xs text-highlight">
          {limitMessage(edition)}
        </p>
      )}
      {soldOut && (
        <p role="status" className="text-sm text-destructive">
          Todas as edições deste NFT estão esgotadas.
        </p>
      )}

      {/* Celular (Figma mobile): barra de compra fixa no rodapé da tela. */}
      <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-[28px] border-t border-[#3d2a1f] bg-card px-6 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(0_0_0/0.35)] md:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-sm font-bold text-muted-foreground">
              Qtd.
            </span>
            <QuantityStepper {...stepper} size="mobile" describedBy="limite-quantidade" />
          </div>
          <p className={cn('text-xl font-bold text-highlight', priceFlash && 'price-flash')}>
            <span className="sr-only">Total: </span>
            {edition ? displayEth(multiplyEth(edition.price, soldOut ? 1 : safeQuantity)) : ''}
          </p>
        </div>
        <div className="mt-4 flex gap-3">
          <Button
            type="button"
            onClick={() => add(true)}
            disabled={soldOut || addToCart.isPending}
            className="h-14 flex-1 rounded-full bg-[linear-gradient(90deg,#d0884b,#b77743)] text-base font-bold"
          >
            {soldOut ? 'Esgotado' : addToCart.isPending ? 'Adicionando…' : 'Comprar NFT'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => add(false)}
            disabled={soldOut || addToCart.isPending}
            aria-label="Adicionar ao carrinho"
            className="size-14 rounded-full bg-[#2f1d15] text-muted-foreground hover:bg-secondary"
          >
            <ShoppingCartIcon className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
