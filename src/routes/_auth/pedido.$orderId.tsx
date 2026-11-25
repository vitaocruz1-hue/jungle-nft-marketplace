import { createFileRoute, Link } from '@tanstack/react-router'
import { Loader2Icon, MailOpenIcon, WifiOffIcon, XCircleIcon, XIcon } from 'lucide-react'

import { Container } from '@/components/layout/container'
import { NotFound } from '@/components/not-found'
import { QueryError } from '@/components/query-error'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NETWORK_LABELS } from '@/contracts/catalog'
import type { Order } from '@/contracts/orders'
import { shortAddress, WALLET_TYPE_LABELS } from '@/contracts/wallets'
import { useOrder } from '@/features/orders/queries'
import { useConnectionStatus } from '@/features/realtime/realtime-store'
import { ApiError } from '@/lib/api-error'
import { displayEth } from '@/lib/eth'

export const Route = createFileRoute('/_auth/pedido/$orderId')({
  head: () => ({ meta: [{ title: 'Pedido · Kurio' }] }),
  component: OrderPage,
})

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const EXPLORER_NAMES = { ethereum: 'Etherscan', polygon: 'Polygonscan', solana: 'Solscan' } as const

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto max-w-[578px] border-b-[10px] border-primary bg-card">
      <Link
        to="/"
        aria-label="Fechar e voltar ao início"
        className="absolute top-3 right-3 grid size-9 place-items-center rounded-sm text-highlight hover:bg-secondary"
      >
        <XIcon className="size-5" />
      </Link>
      {children}
    </div>
  )
}

function PendingOrder({ order }: { order: Order }) {
  const connection = useConnectionStatus()
  return (
    <Panel>
      <div className="flex flex-col items-center gap-4 px-8 py-14 text-center">
        <Loader2Icon
          aria-hidden="true"
          className="size-12 text-highlight motion-safe:animate-spin"
        />
        <h1 className="text-xl font-bold">Processando seu pagamento</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Aguardando a confirmação na rede {NETWORK_LABELS[order.network]}. Você pode atualizar esta
          página: o pedido {order.id} continua sendo acompanhado e não será cobrado duas vezes.
        </p>
        <p className="text-sm">Total: {displayEth(order.total)}</p>
        {connection === 'reconnecting' && (
          <p className="flex items-center gap-2 text-sm text-highlight">
            <WifiOffIcon aria-hidden="true" className="size-4" /> Conexão em tempo real perdida.
            Reconectando…
          </p>
        )}
      </div>
    </Panel>
  )
}

function DeclinedOrder({ order }: { order: Order }) {
  return (
    <Panel>
      <div className="flex flex-col items-center gap-4 px-8 py-14 text-center">
        <XCircleIcon aria-hidden="true" className="size-12 text-destructive" />
        <h1 className="text-xl font-bold">Pagamento recusado</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {order.failureReason ?? 'O pagamento não foi concluído.'} Seus itens continuam no
          carrinho.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/pagamento">Tentar novamente</Link>
          </Button>
          <Button asChild variant="outline" className="border-primary bg-transparent">
            <Link to="/carrinho">Voltar ao carrinho</Link>
          </Button>
        </div>
      </div>
    </Panel>
  )
}

/** Recibo: reproduz o snapshot do pedido (não consulta o catálogo atual). */
function Receipt({ order }: { order: Order }) {
  const network = NETWORK_LABELS[order.network]
  return (
    <Panel>
      <div className="flex flex-col items-center gap-4 px-8 pt-6 pb-5 text-center">
        <MailOpenIcon aria-hidden="true" className="size-16 text-highlight" strokeWidth={1.25} />
        <h1 className="font-bold text-muted-foreground">Seus NFTs agora estão na sua carteira</h1>
      </div>

      <dl className="grid grid-cols-2 gap-y-3 border-y border-primary px-6 py-3 text-xs sm:grid-cols-4 sm:divide-x sm:divide-primary">
        <div className="sm:px-3">
          <dt className="font-bold">ID da transação</dt>
          <dd className="font-mono text-muted-foreground">
            {order.transaction ? shortAddress(order.transaction.hash) : '—'}
          </dd>
        </div>
        <div className="sm:px-3">
          <dt>Data</dt>
          <dd className="text-muted-foreground">{dateFormat.format(new Date(order.updatedAt))}</dd>
        </div>
        <div className="sm:px-3">
          <dt>Total</dt>
          <dd className="text-muted-foreground">{displayEth(order.total)}</dd>
        </div>
        <div className="sm:px-3">
          <dt className="font-bold">Carteira</dt>
          <dd className="text-muted-foreground">{WALLET_TYPE_LABELS[order.wallet.type]}</dd>
        </div>
      </dl>

      <div className="px-6 pt-6 pb-10 sm:px-11">
        <h2 className="text-sm font-bold">Detalhes da transação</h2>
        <table className="mt-2 w-full text-left text-sm">
          <caption className="sr-only">Itens do pedido {order.id}</caption>
          <thead className="border-b border-[#442c1a]">
            <tr>
              <th scope="col" className="py-2 font-bold">
                NFTs
              </th>
              <th scope="col" className="py-2 text-center font-bold">
                Edições
              </th>
              <th scope="col" className="py-2 text-right font-bold">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.editionId}>
                <td className="py-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image.src}
                      alt=""
                      width={64}
                      height={64}
                      className="size-16 rounded-md object-cover"
                    />
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">ID do token: {item.tokenId}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2 text-center text-xs">(x {item.quantity})</td>
                <td className="py-2 text-right font-bold text-highlight">
                  {displayEth(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-4 space-y-1 border-b border-[#442c1a] pb-3 text-sm">
          {order.discount !== '0.00' && (
            <div className="flex justify-between">
              <dt>Desconto{order.coupon ? ` (${order.coupon.code})` : ''}</dt>
              <dd>(-) {displayEth(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Taxa de rede</dt>
            <dd className="text-base">{displayEth(order.networkFee)}</dd>
          </div>
          <div className="flex justify-between font-bold">
            <dt>Total</dt>
            <dd className="text-base text-highlight">{displayEth(order.total)}</dd>
          </div>
        </dl>

        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          Transação confirmada na {network}. A propriedade foi transferida para sua carteira
          conectada ({shortAddress(order.wallet.address)}) e registrada na rede. Referência simulada
          para esta demonstração.
        </p>
        {order.transaction && (
          <div className="mt-5 flex justify-center">
            <Button asChild className="h-11 px-4 font-bold">
              <a href={order.transaction.explorerUrl} target="_blank" rel="noopener noreferrer">
                Ver no {EXPLORER_NAMES[order.network]}
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </Button>
          </div>
        )}
      </div>
    </Panel>
  )
}

function OrderPage() {
  const { orderId } = Route.useParams()
  const query = useOrder(orderId)
  const order = query.data

  let content: React.ReactNode
  if (query.isPending) {
    content = (
      <Skeleton aria-label="Carregando pedido" className="mx-auto h-[520px] max-w-[578px]" />
    )
  } else if (query.error instanceof ApiError && query.error.code === 'NOT_FOUND') {
    content = (
      <NotFound
        title="Pedido não encontrado"
        description="Este pedido não existe ou não pertence à sua conta."
      />
    )
  } else if (!order) {
    content = (
      <QueryError
        error={query.error}
        onRetry={() => void query.refetch()}
        isRetrying={query.isFetching}
      />
    )
  } else if (order.status === 'confirmed') {
    content = <Receipt order={order} />
  } else if (order.status === 'declined') {
    content = <DeclinedOrder order={order} />
  } else {
    content = <PendingOrder order={order} />
  }

  return (
    <Container className="py-12 sm:py-20">
      {/* Anuncia a mudança de estado do pedido para leitores de tela. */}
      <p role="status" className="sr-only">
        {order?.status === 'confirmed'
          ? 'Pedido confirmado.'
          : order?.status === 'declined'
            ? 'Pagamento recusado.'
            : order
              ? 'Pedido pendente, aguardando confirmação.'
              : ''}
      </p>
      {content}
    </Container>
  )
}
