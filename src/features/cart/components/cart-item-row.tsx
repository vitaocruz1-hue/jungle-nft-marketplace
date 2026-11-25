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

  return (
    <li
      aria-busy={busy}
      className={cn(
        'grid grid-cols-[70px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 bg-card pr-3 transition-opacity md:grid-cols-[70px_minmax(0,1fr)_120px_110px_120px_40px] md:gap-x-4',
        busy && 'opacity-70',
        item.issues.length > 0 && 'outline-1 outline-primary/60',
      )}
    >
      <img
        src={item.image.src}
        alt=""
        width={item.image.width}
        height={item.image.height}
        loading="lazy"
        className="size-[70px] object-cover"
      />

      <div className="min-w-0 py-2">
        <Link
          to="/nft/$nftId"
          params={{ nftId: item.nftId }}
          className="block truncate text-sm font-bold hover:text-highlight sm:text-base"
        >
          {item.name}
        </Link>
        <p className="truncate text-xs text-muted-foreground sm:text-sm">
          ID do token: {item.tokenId}
        </p>
        <p className="truncate text-xs text-muted-foreground">Edição {item.editionLabel}</p>
      </div>

      <p className="row-start-2 text-sm font-bold text-muted-foreground md:row-start-auto md:text-base">
        <span className="sr-only">Preço unitário: </span>
        {displayEth(item.unitPrice)}
      </p>

      <div className="col-start-2 row-start-2 flex items-center gap-2 justify-self-center md:col-start-auto md:row-start-auto md:justify-self-start">
        <Button
          size="icon"
          className="h-6 w-5 rounded-full"
          aria-label={`Diminuir quantidade de ${item.name}`}
          disabled={busy || item.quantity <= 1}
          onClick={() => changeQuantity(item.quantity - 1)}
        >
          <MinusIcon className="size-3.5" />
        </Button>
        <span className="min-w-5 text-center" aria-live="polite">
          <span className="sr-only">Quantidade: </span>
          {item.quantity}
        </span>
        <Button
          size="icon"
          className="h-6 w-5 rounded-full"
          aria-label={`Aumentar quantidade de ${item.name}`}
          disabled={busy || item.quantity >= limit}
          onClick={() => changeQuantity(item.quantity + 1)}
        >
          <PlusIcon className="size-3.5" />
        </Button>
      </div>

      <p className="col-start-3 row-start-2 text-sm font-bold text-highlight md:col-start-auto md:row-start-auto md:text-base">
        <span className="sr-only">Total do item: </span>
        {displayEth(item.lineTotal)}
      </p>

      <Button
        variant="ghost"
        size="icon"
        className="col-start-3 row-start-1 justify-self-end hover:bg-secondary md:col-start-auto md:row-start-auto"
        aria-label={`Remover ${item.name} do carrinho`}
        disabled={busy}
        onClick={handleRemove}
      >
        <Trash2Icon className="size-5" />
      </Button>

      {item.issues.length > 0 && (
        <div role="status" className="col-span-full px-3 pb-3 text-xs md:pl-[86px]">
          <IssueNotice item={item} />
        </div>
      )}
    </li>
  )
}
