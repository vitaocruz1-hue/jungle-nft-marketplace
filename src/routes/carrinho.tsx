import { createFileRoute, Link } from '@tanstack/react-router'
import { ShoppingCartIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Breadcrumb } from '@/components/breadcrumb'
import { Container } from '@/components/layout/container'
import { QueryError } from '@/components/query-error'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Cart } from '@/contracts/cart'
import { CartItemRow } from '@/features/cart/components/cart-item-row'
import { CartSummary, CartSummarySkeleton } from '@/features/cart/components/cart-summary'
import { useAcknowledgeCartChanges, useCart } from '@/features/cart/queries'
import { RelatedNfts } from '@/features/nft-detail/components/related-nfts'
import { getErrorMessage } from '@/lib/api-error'

export const Route = createFileRoute('/carrinho')({
  head: () => ({ meta: [{ title: 'Carrinho · Kurio' }] }),
  component: CartPage,
})

/** Motivo que impede seguir para o pagamento (ou null). */
function blockedReason(cart: Cart) {
  if (cart.items.length === 0) return 'Seu carrinho está vazio.'
  if (cart.items.some((i) => i.issues.includes('OUT_OF_STOCK')))
    return 'Remova os itens esgotados para continuar.'
  if (cart.items.some((i) => i.issues.includes('QUANTITY_UNAVAILABLE')))
    return 'Ajuste as quantidades indisponíveis para continuar.'
  if (cart.items.some((i) => i.issues.includes('PRICE_CHANGED')))
    return 'Confirme os novos preços para continuar.'
  return null
}

function PriceChangeBanner() {
  const acknowledge = useAcknowledgeCartChanges()
  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-primary bg-secondary px-4 py-3 text-sm"
    >
      <p>Alguns preços mudaram desde que você adicionou os itens. O resumo já foi atualizado.</p>
      <Button
        size="sm"
        disabled={acknowledge.isPending}
        onClick={() =>
          acknowledge.mutate(undefined, {
            onError: (e) => toast.error(getErrorMessage(e)),
          })
        }
      >
        Entendi, manter novos preços
      </Button>
    </div>
  )
}

function CartSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando carrinho"
      className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_332px] lg:gap-20"
    >
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-[70px] w-full rounded-none" />
        ))}
      </div>
      <CartSummarySkeleton />
    </div>
  )
}

function CartPage() {
  const query = useCart()
  const cart = query.data

  return (
    <Container className="pt-8">
      <Breadcrumb
        items={[
          { label: 'Início', link: { to: '/' } },
          { label: 'Mercado', link: { to: '/', hash: 'catalogo' } },
          { label: 'Carrinho' },
        ]}
      />
      <h1 className="sr-only">Carrinho de NFTs</h1>

      <div className="mt-4">
        {query.isPending ? (
          <CartSkeleton />
        ) : query.isError && !cart ? (
          <QueryError
            title="Não foi possível carregar o carrinho"
            error={query.error}
            onRetry={() => void query.refetch()}
            isRetrying={query.isFetching}
          />
        ) : cart && cart.items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-md bg-card px-6 py-16 text-center">
            <ShoppingCartIcon aria-hidden="true" className="size-10 text-highlight" />
            <p className="text-lg font-bold">Seu carrinho está vazio</p>
            <p className="text-sm text-muted-foreground">
              Explore o mercado e escolha seus próximos NFTs.
            </p>
            <Button asChild>
              <Link to="/" hash="catalogo">
                Explorar NFTs
              </Link>
            </Button>
          </div>
        ) : cart ? (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_332px] lg:gap-20">
            <section aria-labelledby="itens-titulo">
              <h2 id="itens-titulo" className="sr-only">
                Itens do carrinho
              </h2>
              {cart.items.some((i) => i.issues.includes('PRICE_CHANGED')) && <PriceChangeBanner />}
              <div
                aria-hidden="true"
                className="hidden border-b border-[#442c1a] pb-2 text-sm font-bold md:grid md:grid-cols-[70px_minmax(0,1fr)_120px_110px_120px_40px] md:gap-x-4"
              >
                <span className="col-span-2">NFTs</span>
                <span>Preço</span>
                <span>Edições</span>
                <span>Total</span>
              </div>
              <ul className="mt-3 space-y-3">
                {cart.items.map((item) => (
                  <CartItemRow key={item.id} item={item} />
                ))}
              </ul>
            </section>
            <CartSummary cart={cart} blockedReason={blockedReason(cart)} />
          </div>
        ) : null}
      </div>

      {cart?.items[0] && (
        <RelatedNfts nftId={cart.items[0].nftId} title="Colecionadores também viram" />
      )}
    </Container>
  )
}
