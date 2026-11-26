import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle2Icon, Loader2Icon, PackageIcon, XCircleIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { QueryError } from '@/components/query-error'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Order, OrderStatus } from '@/contracts/orders'
import { useOrders } from '@/features/orders/queries'
import { ProfileLayout } from '@/features/profile/components/profile-layout'
import { displayEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_auth/pedidos')({
  head: () => ({ meta: [{ title: 'Meus pedidos · Kurio' }] }),
  component: OrdersPage,
})

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/** Status sempre com ícone + texto (não depende só da cor). */
const STATUS = {
  pending: { label: 'Pendente', Icon: Loader2Icon, className: 'text-highlight' },
  confirmed: { label: 'Confirmado', Icon: CheckCircle2Icon, className: 'text-success' },
  declined: { label: 'Recusado', Icon: XCircleIcon, className: 'text-destructive' },
} satisfies Record<OrderStatus, { label: string; Icon: typeof Loader2Icon; className: string }>

function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, Icon, className } = STATUS[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm font-bold', className)}>
      <Icon
        aria-hidden="true"
        className={cn('size-4', status === 'pending' && 'motion-safe:animate-spin')}
      />
      {label}
    </span>
  )
}

function itemsLabel(order: Order) {
  const [first, ...rest] = order.items
  if (!first) return 'Pedido sem itens'
  return rest.length === 0
    ? first.name
    : `${first.name} + ${rest.length} NFT${rest.length > 1 ? 's' : ''}`
}

function OrderRow({ order }: { order: Order }) {
  const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const cover = order.items[0]?.image

  return (
    <Link
      to="/pedido/$orderId"
      params={{ orderId: order.id }}
      className="flex items-center gap-4 rounded-md bg-card p-3 transition-colors hover:bg-[#2c1b16] sm:p-4"
    >
      {cover ? (
        <img
          src={cover.src}
          alt=""
          width={64}
          height={64}
          loading="lazy"
          decoding="async"
          className="size-14 shrink-0 rounded-sm object-cover sm:size-16"
        />
      ) : (
        <span aria-hidden="true" className="size-14 shrink-0 rounded-sm bg-secondary sm:size-16" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{itemsLabel(order)}</p>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          <time dateTime={order.createdAt}>{dateFormat.format(new Date(order.createdAt))}</time>
          {' · '}
          {quantity} {quantity === 1 ? 'item' : 'itens'}
          <span className="max-sm:hidden"> · Pedido {order.id}</span>
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-bold text-highlight tabular-nums">
          <span className="sr-only">Total: </span>
          {displayEth(order.total)}
        </span>
        <StatusBadge status={order.status} />
      </div>
    </Link>
  )
}

/** Anuncia (leitores de tela) quando um pedido muda de status ao vivo. */
function useStatusAnnouncement(orders: Order[] | undefined) {
  const previous = useRef(new Map<string, OrderStatus>())
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!orders) return
    for (const order of orders) {
      const before = previous.current.get(order.id)
      if (before && before !== order.status) {
        setMessage(`Pedido ${order.id}: ${STATUS[order.status].label.toLowerCase()}.`)
      }
      previous.current.set(order.id, order.status)
    }
  }, [orders])

  return message
}

function OrdersPage() {
  const query = useOrders()
  const announcement = useStatusAnnouncement(query.data?.items)

  return (
    <ProfileLayout menuOnMobile={false}>
      <h1 className="text-2xl font-bold">Meus pedidos</h1>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="mt-6">
        {query.isPending ? (
          <div aria-busy="true" aria-label="Carregando pedidos" className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-[88px] w-full sm:h-24" />
            ))}
          </div>
        ) : query.isError ? (
          <QueryError
            title="Não foi possível carregar seus pedidos"
            error={query.error}
            onRetry={() => void query.refetch()}
            isRetrying={query.isFetching}
          />
        ) : query.data.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md bg-card px-6 py-12 text-center">
            <PackageIcon aria-hidden="true" className="size-8 text-highlight" />
            <p className="text-lg font-bold">Você ainda não fez nenhum pedido</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Os NFTs que você comprar aparecem aqui, com o status de cada pedido.
            </p>
            <Button asChild className="mt-2">
              <Link to="/" hash="catalogo">
                Explorar NFTs
              </Link>
            </Button>
          </div>
        ) : (
          <ul aria-label="Seus pedidos" className="space-y-3">
            {query.data.items.map((order) => (
              <li key={order.id}>
                <OrderRow order={order} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </ProfileLayout>
  )
}
