import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { QueryError } from '@/components/query-error'
import { Skeleton } from '@/components/ui/skeleton'
import { shortAddress, WALLET_TYPE_LABELS, type Wallet } from '@/contracts/wallets'
import { ProfileLayout } from '@/features/profile/components/profile-layout'
import { WalletForm } from '@/features/wallets/components/wallet-form'
import { useWallets } from '@/features/wallets/queries'

export const Route = createFileRoute('/_auth/carteiras')({
  head: () => ({ meta: [{ title: 'Carteiras · Kurio' }] }),
  component: WalletsPage,
})

function WalletSummary({ wallet }: { wallet: Wallet }) {
  return (
    <p className="mt-2 type-body text-muted-foreground">
      {wallet.nickname} · {WALLET_TYPE_LABELS[wallet.type]} ·{' '}
      <span className="font-mono">{shortAddress(wallet.address)}</span>
    </p>
  )
}

function WalletsPage() {
  const query = useWallets()
  const [editing, setEditing] = useState<{ primary: boolean; secondary: boolean }>({
    primary: false,
    secondary: false,
  })
  const [sameAsPrimary, setSameAsPrimary] = useState(false)

  if (query.isPending) {
    return (
      <ProfileLayout>
        <div aria-busy="true" aria-label="Carregando carteiras" className="space-y-4">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-80 w-full" />
        </div>
      </ProfileLayout>
    )
  }
  if (query.isError) {
    return (
      <ProfileLayout>
        <QueryError
          error={query.error}
          onRetry={() => void query.refetch()}
          isRetrying={query.isFetching}
        />
      </ProfileLayout>
    )
  }

  const { primary, secondary } = query.data
  const showPrimaryForm = !primary || editing.primary
  const showSecondaryForm = editing.secondary

  return (
    <ProfileLayout>
      <h1 className="sr-only">Carteiras</h1>

      <section aria-labelledby="carteira-principal-titulo">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="carteira-principal-titulo" className="type-title">
            Carteira principal
          </h2>
          {primary && !editing.primary && (
            <button
              type="button"
              className="cursor-pointer font-bold text-highlight hover:underline"
              onClick={() => setEditing((e) => ({ ...e, primary: true }))}
            >
              Editar
            </button>
          )}
        </div>
        <p className="mt-2 type-body text-muted-foreground">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
        </p>
        {primary && !editing.primary && <WalletSummary wallet={primary} />}
        {showPrimaryForm && (
          <div className="mt-8">
            <WalletForm
              slot="primary"
              initial={primary}
              onSaved={() => setEditing((e) => ({ ...e, primary: false }))}
            />
          </div>
        )}
      </section>

      <section aria-labelledby="carteira-secundaria-titulo" className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="carteira-secundaria-titulo" className="type-title">
            Carteira secundária
          </h2>
          <div className="flex items-center gap-4">
            {primary && (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sameAsPrimary}
                  onChange={(e) => {
                    setSameAsPrimary(e.target.checked)
                    if (e.target.checked) setEditing((s) => ({ ...s, secondary: true }))
                  }}
                  className="size-4 accent-primary"
                />
                Igual à carteira principal
              </label>
            )}
            {!showSecondaryForm && (
              <button
                type="button"
                className="cursor-pointer font-bold text-highlight hover:underline"
                onClick={() => setEditing((e) => ({ ...e, secondary: true }))}
              >
                {secondary ? 'Editar' : 'Adicionar'}
              </button>
            )}
          </div>
        </div>
        {secondary && !showSecondaryForm && <WalletSummary wallet={secondary} />}
        {!secondary && !showSecondaryForm && (
          <p className="mt-2 type-body text-muted-foreground">
            Você ainda não adicionou uma carteira secundária.
          </p>
        )}
        {showSecondaryForm && (
          <div className="mt-8">
            <WalletForm
              key={sameAsPrimary ? 'copia' : 'propria'}
              slot="secondary"
              initial={
                sameAsPrimary && primary
                  ? { ...primary, nickname: `${primary.nickname} (cópia)` }
                  : secondary
              }
              onSaved={() => {
                setSameAsPrimary(false)
                setEditing((e) => ({ ...e, secondary: false }))
              }}
            />
          </div>
        )}
      </section>
    </ProfileLayout>
  )
}
