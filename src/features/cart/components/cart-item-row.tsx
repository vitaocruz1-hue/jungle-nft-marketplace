import { Link } from '@tanstack/react-router'
import { MinusIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import type { CartItem } from '@/contracts/cart'
import { getErrorMessage } from '@/lib/api-error'
import { displayEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

import { useRemoveCartItem, useUpdateCartItem } from '../queries'

function IssueNotice({ item }: { item: CartItem }) {
  if (item.issues.includes('OUT_OF_STOCK')) {
    return <p className="text-destructive">Edição esgotada. Remova este item para continuar.</p>
  }
  return (
    <>
      {item.issues.includes('QUANTITY_UNAVAILABLE') && (
        <p className="text-destructive">
          Só {item.available === 1 ? 'resta 1 unidade' : `restam ${item.available} unidades`}{' '}
          disponíveis. Ajuste a quantidade.
        </p>
      )}
      {item.issues.includes('PRICE_CHANGED') && (
        <p className="text-highlight">
          Preço atualizado: de {displayEth(item.addedUnitPrice)} para {displayEth(item.unitPrice)}.
        </p>
      )}
    </>
  )
}

interface StepperProps {
  item: CartItem
  busy: boolean
  limit: number
  onChange: (quantity: number) => void
  buttonClassName: string
}

function Stepper({ item, busy, limit, onChange, buttonClassName }: StepperProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        className={buttonClassName}
        aria-label={`Diminuir quantidade de ${item.name}`}
        disabled={busy || item.quantity <= 1}
        onClick={() => onChange(item.quantity - 1)}
      >
        <MinusIcon className="size-3.5" />
      </Button>
      <span className="min-w-5 text-center" aria-live="polite">
        <span className="sr-only">Quantidade: </span>
        {item.quantity}
      </span>
      <Button
        size="icon"
        className={buttonClassName}
        aria-label={`Aumentar quantidade de ${item.name}`}
        disabled={busy || item.quantity >= limit}
        onClick={() => onChange(item.quantity + 1)}
      >
        <PlusIcon className="size-3.5" />
      </Button>
    </div>
  )
}

export function CartItemRow({ item }: { item: CartItem }) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const busy = update.isPending || remove.isPending
  const limit = Math.min(item.available, item.maxPerOrder)

  function changeQuantity(quantity: number) {
    update.mutate(
      { itemId: item.id, quantity },
      {
        onError: (error) =>
          toast.error('Não foi possível alterar a quantidade', {
            description: getErrorMessage(error),
          }),
      },
    )
  }

  function handleRemove() {
    remove.mutate(item.id, {
      onSuccess: () => toast.success(`${item.name} removido do carrinho.`),
      onError: (error) =>
        toast.error('Não foi possível remover o item', { description: getErrorMessage(error) }),
    })
  }

  const image = (className: string) => (
    <img
      src={item.image.src}
      alt=""
      width={item.image.width}
      height={item.image.height}
      loading="lazy"
      className={cn('object-cover', className)}
    />
  )

  const nameLink = (
    <Link
      to="/nft/$nftId"
      params={{ nftId: item.nftId }}
      className="block truncate text-[13px] font-bold hover:text-highlight md:text-base"
    >
      {item.name}
    </Link>
  )

  const removeButton = (className?: string) => (
    <Button
      variant="ghost"
      size="icon"
      className={cn('hover:bg-secondary', className)}
      aria-label={`Remover ${item.name} do carrinho`}
      disabled={busy}
      onClick={handleRemove}
    >
      <Trash2Icon className="size-5" />
    </Button>
  )

  return (
    <li
      aria-busy={busy}
      className={cn(
        'bg-card transition-opacity max-md:overflow-hidden max-md:rounded-2xl',
        busy && 'opacity-70',
        item.issues.length > 0 && 'outline-1 outline-primary/60',
      )}
    >
      {/* Desktop/tablet: linha da tabela do Figma (NFT, preço, edições, total). */}
      <div className="hidden grid-cols-[70px_minmax(0,1fr)_120px_110px_120px_40px] items-center gap-x-4 pr-3 md:grid">
        {image('size-[70px]')}
        <div className="min-w-0 py-2">
          {nameLink}
          <p className="truncate text-sm text-muted-foreground">ID do token: {item.tokenId}</p>
          <p className="truncate text-xs text-muted-foreground">Edição {item.editionLabel}</p>
        </div>
        <p className="text-base font-bold text-muted-foreground">
          <span className="sr-only">Preço unitário: </span>
          {displayEth(item.unitPrice)}
        </p>
        <Stepper
          item={item}
          busy={busy}
          limit={limit}
          onChange={changeQuantity}
          buttonClassName="h-6 w-5 rounded-full"
        />
        <p className="text-base font-bold text-highlight">
          <span className="sr-only">Total do item: </span>
          {displayEth(item.lineTotal)}
        </p>
        {removeButton()}
      </div>

      {/* Celular (Figma mobile): card com arte, nome, edição, total e quantidade. */}
      <div className="flex md:hidden">
        {image('size-[94px] shrink-0')}
        <div className="min-w-0 flex-1 py-2.5 pl-3">
          {nameLink}
          <p className="truncate text-[13px] text-muted-foreground">Edição: {item.editionLabel}</p>
          <p className="mt-1.5 text-base font-bold text-highlight">
            <span className="sr-only">Total do item: </span>
            {displayEth(item.lineTotal)}
          </p>
        </div>
        <div className="flex flex-col items-end justify-between py-1.5 pr-3 pl-2">
          {removeButton('size-7')}
          <Stepper
            item={item}
            busy={busy}
            limit={limit}
            onChange={changeQuantity}
            buttonClassName="size-6 rounded-full"
          />
        </div>
      </div>

      {item.issues.length > 0 && (
        <div role="status" className="px-3 pb-3 text-xs md:pl-[86px]">
          <IssueNotice item={item} />
        </div>
      )}
    </li>
  )
}
