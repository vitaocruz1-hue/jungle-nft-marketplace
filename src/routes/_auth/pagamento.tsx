import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AlertTriangleIcon, CheckCircle2Icon, Loader2Icon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Breadcrumb } from '@/components/breadcrumb'
import { FormField } from '@/components/form-field'
import { Container } from '@/components/layout/container'
import { SelectField } from '@/components/select-field'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { EMAIL_PATTERN } from '@/contracts/auth'
import { NETWORK_IDS, NETWORK_LABELS, type NetworkId } from '@/contracts/catalog'
import type { Cart } from '@/contracts/cart'
import type { CheckoutBuyer, Quote } from '@/contracts/orders'
import {
  ENS_NAME_PATTERN,
  REFERRAL_CODE_PATTERN,
  shortAddress,
  WALLET_TYPE_LABELS,
  type Wallet,
} from '@/contracts/wallets'
import { useSession } from '@/features/auth/session'
import { cartKeys, useCart } from '@/features/cart/queries'
import {
  clearCheckoutStorage,
  idempotencyKeyFor,
  loadDraft,
  saveDraft,
} from '@/features/checkout/storage'
import { createOrder, createQuote, orderKeys } from '@/features/orders/queries'
import { onNftChanged } from '@/features/realtime/realtime-store'
import { connectWallet, useWallets } from '@/features/wallets/queries'
import { ApiError, getErrorMessage } from '@/lib/api-error'
import { displayEth } from '@/lib/eth'
import { focusFirstError } from '@/lib/forms'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_auth/pagamento')({
  head: () => ({ meta: [{ title: 'Pagamento · Kurio' }] }),
  component: CheckoutPage,
})

type Connection = 'disconnected' | 'connecting' | 'connected' | 'rejected'
type BuyerForm = CheckoutBuyer & { network: NetworkId }

const NETWORK_OPTIONS = NETWORK_IDS.map((id) => ({ value: id, label: NETWORK_LABELS[id] }))
/** Erros que invalidam a cotação: o usuário precisa revisar de novo. */
const QUOTE_ERRORS = new Set(['PRICE_CHANGED', 'OUT_OF_STOCK', 'QUOTE_EXPIRED', 'COUPON_EXPIRED'])

function validateBuyer(form: BuyerForm, wallet: Wallet | undefined) {
  const errors: Record<string, string> = {}
  if (!form.displayName.trim()) errors.displayName = 'Informe o nome de exibição.'
  if (!form.username.trim()) errors.username = 'Informe o nome de usuário.'
  if (!NETWORK_IDS.includes(form.network)) errors.network = 'Selecione uma rede.'
  if (!form.profileName.trim()) errors.profileName = 'Informe o nome do perfil.'
  if (!REFERRAL_CODE_PATTERN.test(form.referralCode))
    errors.referralCode = 'Use de 4 a 12 letras maiúsculas ou números.'
  if (!EMAIL_PATTERN.test(form.email)) errors.email = 'Informe um e-mail válido.'
  if (!ENS_NAME_PATTERN.test(form.ensName))
    errors.ensName = 'Use de 3 a 40 letras minúsculas, números ou hífen.'
  if (!wallet) errors.walletId = 'Selecione uma carteira cadastrada.'
  return errors
}

function readBuyer(form: HTMLFormElement): BuyerForm {
  const data = new FormData(form)
  const text = (name: string) => String(data.get(name) ?? '').trim()
  return {
    displayName: text('displayName'),
    username: text('username'),
    network: text('network') as NetworkId,
    profileName: text('profileName'),
    email: text('email'),
    referralCode: text('referralCode').toUpperCase(),
    ensName: text('ensName')
      .toLowerCase()
      .replace(/\.eth$/, ''),
    note: text('note'),
  }
}

function CheckoutSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando pagamento"
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_405px]"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-10" />
      </div>
    </div>
  )
}

function CheckoutPage() {
  const cartQuery = useCart()
  const walletsQuery = useWallets()
  const { user } = useSession()

  let content: React.ReactNode
  if (cartQuery.isPending || walletsQuery.isPending || !user) {
    content = <CheckoutSkeleton />
  } else if (!cartQuery.data || !walletsQuery.data) {
    content = (
      <p role="alert" className="text-destructive">
        {getErrorMessage(cartQuery.error ?? walletsQuery.error)}
      </p>
    )
  } else if (cartQuery.data.items.length === 0) {
    content = (
      <div className="rounded-md bg-card px-6 py-12 text-center">
        <p className="text-lg font-bold">Seu carrinho está vazio</p>
        <Button asChild className="mt-4">
          <Link to="/" hash="catalogo">
            Explorar NFTs
          </Link>
        </Button>
      </div>
    )
  } else {
    content = (
      <CheckoutFlow
        cart={cartQuery.data}
        wallets={[walletsQuery.data.primary, walletsQuery.data.secondary].filter(
          (w): w is Wallet => w !== null,
        )}
        userId={user.id}
        defaults={{
          displayName: user.displayName,
          username: user.username,
          email: user.email,
          profileName: walletsQuery.data.primary?.profileName ?? user.username,
          referralCode: walletsQuery.data.primary?.referralCode ?? '',
          ensName: walletsQuery.data.primary?.ensName ?? '',
          network: walletsQuery.data.primary?.network ?? 'ethereum',
          note: '',
        }}
      />
    )
  }

  return (
    <Container className="pt-8">
      <Breadcrumb
        items={[
          { label: 'Início', link: { to: '/' } },
          { label: 'Mercado', link: { to: '/', hash: 'catalogo' } },
          { label: 'Pagamento' },
        ]}
      />
      <h1 className="sr-only">Pagamento</h1>
      <div className="mt-6">{content}</div>
    </Container>
  )
}

interface CheckoutFlowProps {
  cart: Cart
  wallets: Wallet[]
  userId: string
  defaults: BuyerForm
}

function CheckoutFlow({ cart, wallets, userId, defaults }: CheckoutFlowProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement>(null)
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null)
  const submittingRef = useRef(false)

  const [initial] = useState(
    () => ({ ...defaults, ...loadDraft(userId) }) as BuyerForm & { walletId?: string },
  )
  const [walletId, setWalletId] = useState(initial.walletId ?? wallets[0]?.id)
  const [buyer, setBuyer] = useState<BuyerForm | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [staleReason, setStaleReason] = useState<string | null>(null)
  const [connection, setConnection] = useState<Connection>('disconnected')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [alert, setAlert] = useState<string | null>(null)

  const wallet = wallets.find((w) => w.id === walletId)
  const secondary = wallets.find((w) => w.slot === 'secondary')

  const quoteMutation = useMutation({ mutationFn: createQuote })
  const orderMutation = useMutation({
    mutationFn: ({ body, key }: { body: Parameters<typeof createOrder>[0]; key: string }) =>
      createOrder(body, key),
  })

  // Preço/estoque mudou (Socket.IO) durante a revisão → exige nova cotação.
  useEffect(() => {
    if (!quote) return
    return onNftChanged((event) => {
      const item = quote.items.find((i) => i.nftId === event.resource.id)
      if (item) setStaleReason(`O preço ou a disponibilidade de ${item.name} mudou.`)
    })
  }, [quote])

  // Cotação vence em alguns minutos.
  useEffect(() => {
    if (!quote) return
    const ms = new Date(quote.expiresAt).getTime() - Date.now()
    const timer = setTimeout(() => setStaleReason('A cotação expirou.'), Math.max(ms, 0))
    return () => clearTimeout(timer)
  }, [quote])

  function persistDraft() {
    if (!formRef.current) return
    saveDraft(userId, { ...readBuyer(formRef.current), walletId })
  }

  function requestQuote(form: BuyerForm) {
    setAlert(null)
    quoteMutation.mutate(form.network, {
      onSuccess: (newQuote) => {
        setBuyer(form)
        setQuote(newQuote)
        setStaleReason(null)
      },
      onError: (error) => setAlert(getErrorMessage(error)),
    })
  }

  function handleReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = readBuyer(event.currentTarget)
    const found = validateBuyer(form, wallet)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setAlert('Revise os campos destacados.')
      return focusFirstError(formRef.current, found)
    }
    persistDraft()
    requestQuote(form)
  }

  async function ensureWalletConnected() {
    if (!wallet) return false
    if (connection === 'connected') return true
    setConnection('connecting')
    try {
      await connectWallet(wallet.id)
      setConnection('connected')
      return true
    } catch (error) {
      setConnection('rejected')
      setAlert(getErrorMessage(error))
      return false
    }
  }

  async function confirmPurchase() {
    if (!quote || !buyer || !wallet || staleReason || submittingRef.current) return
    submittingRef.current = true // trava cliques repetidos antes mesmo do re-render
    setAlert(null)
    try {
      if (!(await ensureWalletConnected())) return
      const { network: _network, ...buyerData } = buyer
      const key = idempotencyKeyFor(quote.id)
      const order = await orderMutation.mutateAsync({
        body: { quoteId: quote.id, walletId: wallet.id, buyer: buyerData },
        key,
      })
      clearCheckoutStorage()
      queryClient.setQueryData(orderKeys.detail(userId, order.id), order)
      void navigate({ to: '/pedido/$orderId', params: { orderId: order.id } })
    } catch (error) {
      if (error instanceof ApiError && QUOTE_ERRORS.has(error.code)) {
        setQuote(null)
        void queryClient.invalidateQueries({ queryKey: cartKeys.all })
        setAlert(`${error.message} Revise o pedido e confirme novamente.`)
      } else if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        setQuote(null)
        setErrors(error.fieldErrors)
        setAlert(error.message)
      } else {
        setAlert(
          `${getErrorMessage(error)} Você pode tentar novamente sem risco de compra duplicada.`,
        )
      }
    } finally {
      submittingRef.current = false
    }
  }

  const reviewing = quote !== null && buyer !== null

  // Ao abrir a revisão, o foco vai para o título (leitores de tela anunciam a nova etapa).
  useEffect(() => {
    if (reviewing) reviewHeadingRef.current?.focus()
  }, [reviewing])
  const totals = quote ?? cart
  const items = quote?.items ?? cart.items
  const busy = quoteMutation.isPending || orderMutation.isPending || connection === 'connecting'

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleReview}
      onChange={persistDraft}
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_405px] lg:gap-8"
    >
      <div className="min-w-0">
        {alert && (
          <p
            role="alert"
            className="mb-6 flex gap-2 rounded-sm border border-destructive/60 bg-card px-4 py-3 text-sm"
          >
            <AlertTriangleIcon aria-hidden="true" className="size-5 shrink-0 text-destructive" />
            {alert}
          </p>
        )}

        {/* Revisão: dados congelados até confirmar ou voltar para editar. */}
        <section hidden={!reviewing} aria-labelledby="revisao-titulo">
          <h2
            id="revisao-titulo"
            ref={reviewHeadingRef}
            tabIndex={-1}
            className="text-lg font-bold outline-none"
          >
            Revise seu pedido
          </h2>
          {buyer && wallet && (
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              {[
                ['Nome de exibição', buyer.displayName],
                ['Nome de usuário', buyer.username],
                ['Nome do perfil', buyer.profileName],
                ['E-mail', buyer.email],
                ['Código de indicação', buyer.referralCode],
                ['Nome ENS', `${buyer.ensName}.eth`],
                ['Rede', NETWORK_LABELS[buyer.network]],
                [
                  'Carteira',
                  `${wallet.nickname} · ${WALLET_TYPE_LABELS[wallet.type]} · ${shortAddress(wallet.address)}`,
                ],
                ...(buyer.note ? [['Observação', buyer.note]] : []),
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 break-words">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          <Button
            type="button"
            variant="outline"
            className="mt-6 border-primary bg-transparent"
            disabled={busy}
            onClick={() => {
              setQuote(null)
              setStaleReason(null)
            }}
          >
            Editar dados
          </Button>
        </section>

        {/* Formulário (fica no DOM durante a revisão para preservar os valores). */}
        <fieldset hidden={reviewing} disabled={busy} className="min-w-0">
          <legend className="text-lg font-bold">Perfil do colecionador</legend>
          <div className="mt-4 grid gap-x-6 gap-y-5 md:grid-cols-2">
            <FormField
              id="pg-nome"
              name="displayName"
              label="Nome de exibição"
              required
              defaultValue={initial.displayName}
              error={errors.displayName}
              autoComplete="name"
            />
            <FormField
              id="pg-usuario"
              name="username"
              label="Nome de usuário"
              required
              defaultValue={initial.username}
              error={errors.username}
              autoComplete="username"
            />
            <SelectField
              id="pg-rede"
              name="network"
              label="Rede"
              placeholder="Selecione uma rede"
              options={NETWORK_OPTIONS}
              defaultValue={initial.network}
              required
              error={errors.network}
            />
            <FormField
              id="pg-perfil"
              name="profileName"
              label="Nome do perfil"
              required
              defaultValue={initial.profileName}
              error={errors.profileName}
            />
            <FormField
              id="pg-endereco"
              label="Endereço da carteira"
              readOnly
              value={wallet?.address ?? ''}
              placeholder="Endereço 0x da carteira"
              hint="Vem da carteira selecionada ao lado."
            />
            <FormField
              id="pg-ens-secundaria"
              label="ENS ou carteira secundária (opcional)"
              readOnly
              value={wallet?.secondaryAddress ?? ''}
              placeholder="ENS ou carteira secundária (opcional)"
            />
            <FormField
              id="pg-tipo"
              label="Tipo de carteira"
              readOnly
              value={wallet ? WALLET_TYPE_LABELS[wallet.type] : ''}
              placeholder="Selecione uma carteira"
            />
            <FormField
              id="pg-indicacao"
              name="referralCode"
              label="Código de indicação"
              required
              defaultValue={initial.referralCode}
              error={errors.referralCode}
            />
            <FormField
              id="pg-email"
              name="email"
              type="email"
              label="E-mail"
              required
              defaultValue={initial.email}
              error={errors.email}
              autoComplete="email"
            />
            <FormField
              id="pg-ens"
              name="ensName"
              label="Nome ENS (sem .eth)"
              required
              defaultValue={initial.ensName}
              error={errors.ensName}
            />
          </div>

          {secondary && (
            <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={walletId === secondary.id}
                onChange={(e) => {
                  setWalletId(e.target.checked ? secondary.id : wallets[0]?.id)
                  setConnection('disconnected')
                }}
                className="size-4 accent-primary"
              />
              Usar outra carteira? (secundária: {secondary.nickname})
            </label>
          )}

          <div className="mt-6 max-w-[350px]">
            <Label htmlFor="pg-observacao" className="mb-2 text-sm font-normal">
              Observação do colecionador (opcional)
            </Label>
            <textarea
              id="pg-observacao"
              name="note"
              rows={6}
              maxLength={500}
              defaultValue={initial.note}
              className="w-full rounded-sm border border-[#3d2a1f] bg-card p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>
        </fieldset>
      </div>

      <aside aria-labelledby="seus-nfts-titulo" className="space-y-6">
        <section>
          <h2 id="seus-nfts-titulo" className="text-lg font-bold">
            Seus NFTs
          </h2>
          <ul className="mt-3 space-y-3">
            {items.map((item) => (
              <li key={item.editionId} className="flex items-center gap-3 bg-card pr-3">
                <img
                  src={item.image.src}
                  alt=""
                  width={70}
                  height={70}
                  className="size-[70px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    ID do token: {item.tokenId} · Ed. {item.editionLabel}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">(x {item.quantity})</span>
                <span className="text-sm font-bold text-highlight">
                  {displayEth(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
          {!reviewing && (
            <p className="mt-3 text-center text-sm">
              Tem um código promocional?{' '}
              <Link to="/carrinho" className="text-highlight underline-offset-4 hover:underline">
                Aplique no carrinho
              </Link>
            </p>
          )}
        </section>

        <dl className="space-y-2.5 text-sm" aria-live="polite">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="text-base tabular-nums">{displayEth(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Desconto{totals.coupon ? ` (${totals.coupon.code})` : ' do lançamento'}</dt>
            <dd className="tabular-nums">(-) {displayEth(totals.discount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Taxa de rede{quote ? ` (${NETWORK_LABELS[quote.network]})` : ''}</dt>
            <dd className="text-base tabular-nums">{displayEth(totals.networkFee)}</dd>
          </div>
          {!quote && <p className="text-center text-xs text-highlight">Taxa estimada</p>}
          <div className="flex justify-between border-t border-[#442c1a] pt-3">
            <dt className="font-bold">Total</dt>
            <dd className="text-lg font-bold text-highlight tabular-nums">
              {displayEth(totals.total)}
            </dd>
          </div>
        </dl>

        <fieldset disabled={busy || reviewing}>
          <legend className="mx-auto text-base font-bold">Carteira e rede</legend>
          {wallets.length === 0 ? (
            <p className="mt-3 text-sm">
              Você ainda não tem carteiras.{' '}
              <Link to="/carteiras" className="text-highlight underline">
                Cadastre uma carteira
              </Link>{' '}
              para continuar.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {wallets.map((w) => (
                <label
                  key={w.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition-colors',
                    w.id === walletId
                      ? 'border-foreground'
                      : 'border-[#3d2a1f] hover:border-primary/60',
                  )}
                >
                  <input
                    type="radio"
                    name="walletId"
                    value={w.id}
                    checked={w.id === walletId}
                    onChange={() => {
                      setWalletId(w.id)
                      setConnection('disconnected')
                    }}
                    className="size-4 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="block font-bold">{WALLET_TYPE_LABELS[w.type]}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {w.nickname} · {shortAddress(w.address)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {errors.walletId && (
            <p className="mt-2 text-xs font-semibold text-destructive">{errors.walletId}</p>
          )}
        </fieldset>

        {reviewing && wallet && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-2 text-sm">
            {connection === 'connected' ? (
              <>
                <span className="flex items-center gap-2 text-success">
                  <CheckCircle2Icon aria-hidden="true" className="size-4" />
                  {WALLET_TYPE_LABELS[wallet.type]} conectada
                </span>
                <button
                  type="button"
                  className="cursor-pointer text-highlight underline"
                  disabled={busy}
                  onClick={() => setConnection('disconnected')}
                >
                  Desconectar
                </button>
              </>
            ) : connection === 'connecting' ? (
              <span className="flex items-center gap-2">
                <Loader2Icon aria-hidden="true" className="size-4 motion-safe:animate-spin" />{' '}
                Aguardando aprovação na carteira…
              </span>
            ) : connection === 'rejected' ? (
              <span className="text-destructive">Conexão recusada. Tente novamente.</span>
            ) : (
              <span className="text-muted-foreground">A carteira será conectada ao confirmar.</span>
            )}
          </div>
        )}

        {staleReason && (
          <div
            role="alert"
            className="rounded-sm border border-primary bg-secondary px-4 py-3 text-sm"
          >
            <p>{staleReason} Os valores precisam ser confirmados de novo.</p>
            <Button
              type="button"
              size="sm"
              className="mt-3"
              disabled={busy}
              onClick={() => buyer && requestQuote(buyer)}
            >
              Atualizar cotação
            </Button>
          </div>
        )}

        {reviewing ? (
          <Button
            type="button"
            onClick={() => void confirmPurchase()}
            disabled={busy || staleReason !== null}
            className="h-11 w-full text-base font-bold"
          >
            {orderMutation.isPending
              ? 'Enviando pedido…'
              : connection === 'connecting'
                ? 'Conectando carteira…'
                : 'Confirmar compra'}
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={busy || wallets.length === 0}
            className="h-11 w-full text-base font-bold"
          >
            {quoteMutation.isPending ? 'Calculando cotação…' : 'Revisar pedido'}
          </Button>
        )}
      </aside>
    </form>
  )
}
