import { Link } from '@tanstack/react-router'
import { XIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import type { Cart } from '@/contracts/cart'
import { getErrorMessage } from '@/lib/api-error'
import { displayEth } from '@/lib/eth'

import { useApplyCoupon, useRemoveCoupon } from '../queries'

function CouponForm({ cart }: { cart: Cart }) {
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  if (cart.coupon) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-sm border border-primary/60 px-3 py-2 text-sm">
        <span>
          <strong className="text-highlight">{cart.coupon.code}</strong> · {cart.coupon.description}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 hover:bg-secondary"
          aria-label={`Remover cupom ${cart.coupon.code}`}
          disabled={remove.isPending}
          onClick={() =>
            remove.mutate(undefined, {
              onSuccess: () => toast.success('Cupom removido.'),
              onError: (e) => toast.error(getErrorMessage(e)),
            })
          }
        >
          <XIcon className="size-4" />
        </Button>
      </div>
    )
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = String(new FormData(event.currentTarget).get('code') ?? '').trim()
    if (!code) {
      setError('Informe o código promocional.')
      inputRef.current?.focus()
      return
    }
    setError(null)
    apply.mutate(code, {
      onSuccess: () => toast.success('Cupom aplicado!'),
      onError: (e) => {
        setError(getErrorMessage(e))
        inputRef.current?.focus()
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Label htmlFor="cupom" className="text-sm font-bold max-md:sr-only">
        Código promocional
      </Label>
      <div className="mt-3 flex max-md:mt-0 max-md:rounded-full max-md:bg-[#2f1d15] max-md:p-1">
        <Input
          ref={inputRef}
          id="cupom"
          name="code"
          autoComplete="off"
          placeholder="Digite o código promocional..."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'cupom-erro' : undefined}
          className="h-10 rounded-r-none border-primary bg-transparent text-xs uppercase placeholder:normal-case max-md:h-11 max-md:rounded-l-full max-md:border-0 max-md:pl-4"
        />
        <Button
          type="submit"
          disabled={apply.isPending}
          className="h-10 rounded-l-none px-5 text-base font-bold max-md:h-11 max-md:rounded-full max-md:bg-[linear-gradient(90deg,#8a5a33,#c98348)]"
        >
          {apply.isPending ? 'Aplicando…' : 'Aplicar'}
        </Button>
      </div>
      {error && (
        <p
          id="cupom-erro"
          role="alert"
          className="mt-2 type-caption font-semibold text-destructive"
        >
          {error}
        </p>
      )}
    </form>
  )
}

interface CartSummaryProps {
  cart: Cart
  /** Itens com problema impedem seguir para o pagamento. */
  blockedReason: string | null
}

export function CartSummary({ cart, blockedReason }: CartSummaryProps) {
  const rows = [
    { label: 'Subtotal', value: displayEth(cart.subtotal) },
    {
      label: 'Desconto do lançamento',
      value: `(-) ${displayEth(cart.discount)}`,
    },
    { label: 'Taxa de rede', value: displayEth(cart.networkFee), hint: 'Taxa estimada' },
  ]

  return (
    <section
      aria-labelledby="resumo-titulo"
      className="max-md:-mx-5 max-md:rounded-t-[28px] max-md:bg-[#221411] max-md:px-6 max-md:pt-6 max-md:pb-8 lg:sticky lg:top-6"
    >
      <h2 id="resumo-titulo" className="border-b border-[#442c1a] pb-3 type-heading max-md:sr-only">
        Resumo da carteira
      </h2>
      <div className="mt-6 max-md:mt-0">
        <CouponForm cart={cart} />
      </div>

      <dl className="mt-6 space-y-3" aria-live="polite">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-3 type-body">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-base tabular-nums">{row.value}</dd>
            </div>
            {row.hint && (
              <p className="mt-0.5 text-right type-caption text-highlight">{row.hint}</p>
            )}
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 border-t border-[#442c1a] pt-4">
          <dt className="font-bold">Total</dt>
          <dd className="text-lg font-bold text-highlight tabular-nums">
            {displayEth(cart.total)}
          </dd>
        </div>
      </dl>

      {blockedReason && (
        <p id="checkout-bloqueado" role="status" className="mt-4 type-body text-destructive">
          {blockedReason}
        </p>
      )}

      <Button
        asChild={!blockedReason}
        disabled={Boolean(blockedReason)}
        aria-describedby={blockedReason ? 'checkout-bloqueado' : undefined}
        className="mt-6 h-10 w-full text-base font-bold max-md:h-14 max-md:rounded-full max-md:bg-[linear-gradient(90deg,#cf884b,#b77843)]"
      >
        {blockedReason ? (
          <span>Conectar e finalizar</span>
        ) : (
          <Link to="/pagamento">Conectar e finalizar</Link>
        )}
      </Button>
      <Link
        to="/"
        hash="catalogo"
        className="mt-4 block text-center type-body font-bold text-highlight hover:underline"
      >
        Continuar explorando
      </Link>
    </section>
  )
}

export function CartSummarySkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-7 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
