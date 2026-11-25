import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { FormField } from '@/components/form-field'
import { SelectField } from '@/components/select-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NETWORK_IDS, NETWORK_LABELS, type NetworkId } from '@/contracts/catalog'
import {
  validateWallet,
  WALLET_TYPE_LABELS,
  WALLET_TYPES,
  type Wallet,
  type WalletInput,
  type WalletSlot,
  type WalletType,
} from '@/contracts/wallets'
import { ApiError, getErrorMessage } from '@/lib/api-error'
import { focusFirstError } from '@/lib/forms'

import { useSaveWallet } from '../queries'

const NETWORK_OPTIONS = NETWORK_IDS.map((id) => ({ value: id, label: NETWORK_LABELS[id] }))
const TYPE_OPTIONS = WALLET_TYPES.map((id) => ({ value: id, label: WALLET_TYPE_LABELS[id] }))

function readForm(form: HTMLFormElement): WalletInput {
  const data = new FormData(form)
  const text = (name: string) => String(data.get(name) ?? '').trim()
  return {
    displayName: text('displayName'),
    nickname: text('nickname'),
    network: text('network') as NetworkId,
    profileName: text('profileName'),
    address: text('address'),
    secondaryAddress: text('secondaryAddress'),
    type: text('type') as WalletType,
    referralCode: text('referralCode').toUpperCase(),
    email: text('email'),
    ensName: text('ensName')
      .toLowerCase()
      .replace(/\.eth$/, ''),
  }
}

interface WalletFormProps {
  slot: WalletSlot
  initial: Partial<WalletInput> | null
  onSaved?: (wallet: Wallet) => void
}

/** Formulário "Carteira principal/secundária" do Figma. */
export function WalletForm({ slot, initial, onSaved }: WalletFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const save = useSaveWallet()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const prefix = `carteira-${slot}`

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = readForm(event.currentTarget)
    const found = validateWallet(input)
    setErrors(found)
    if (Object.keys(found).length > 0) return focusFirstError(formRef.current, found)

    save.mutate(
      { slot, input },
      {
        onSuccess: (wallet) => {
          toast.success(
            slot === 'primary' ? 'Carteira principal salva.' : 'Carteira secundária salva.',
          )
          onSaved?.(wallet)
        },
        onError: (error) => {
          if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
            setErrors(error.fieldErrors)
            focusFirstError(formRef.current, error.fieldErrors)
          } else {
            toast.error('Não foi possível salvar a carteira', {
              description: getErrorMessage(error),
            })
          }
        },
      },
    )
  }

  const field = (name: keyof WalletInput) => ({
    id: `${prefix}-${name}`,
    name,
    defaultValue: initial?.[name] ?? '',
    error: errors[name],
  })

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} aria-busy={save.isPending}>
      <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
        <FormField
          {...field('displayName')}
          label="Nome de exibição"
          required
          autoComplete="name"
        />
        <FormField {...field('nickname')} label="Apelido da carteira" required />
        <SelectField
          {...field('network')}
          label="Rede"
          placeholder="Selecione uma rede"
          options={NETWORK_OPTIONS}
          required
        />
        <FormField {...field('profileName')} label="Nome do perfil" required />
        <FormField
          {...field('address')}
          label="Endereço da carteira"
          placeholder="Endereço 0x da carteira"
          required
          spellCheck={false}
        />
        <FormField
          {...field('secondaryAddress')}
          label="ENS ou carteira secundária (opcional)"
          placeholder="ENS ou carteira secundária (opcional)"
          spellCheck={false}
        />
        <SelectField
          {...field('type')}
          label="Tipo de carteira"
          placeholder="Selecione uma carteira"
          options={TYPE_OPTIONS}
          required
        />
        <FormField {...field('referralCode')} label="Código de indicação" required />
        <FormField {...field('email')} label="E-mail" type="email" required autoComplete="email" />
        <div>
          <Label htmlFor={`${prefix}-ensName`} className="mb-2 text-sm font-normal">
            Nome ENS
            <span aria-hidden="true" className="-ml-1 text-base text-highlight">
              *
            </span>
          </Label>
          <div className="flex gap-2">
            <Input
              id={`${prefix}-ensName`}
              name="ensName"
              required
              defaultValue={initial?.ensName ?? ''}
              aria-invalid={errors.ensName ? true : undefined}
              aria-describedby={errors.ensName ? `${prefix}-ensName-erro` : `${prefix}-ens-sufixo`}
              className="h-10 rounded-sm border-[#3d2a1f] bg-card text-sm"
            />
            <span
              id={`${prefix}-ens-sufixo`}
              className="grid h-10 min-w-[78px] place-items-center rounded-sm border border-[#3d2a1f] bg-card text-sm"
            >
              .eth
            </span>
          </div>
          {errors.ensName && (
            <p
              id={`${prefix}-ensName-erro`}
              className="mt-1.5 text-xs font-semibold text-destructive"
            >
              {errors.ensName}
            </p>
          )}
        </div>
      </div>
      <Button type="submit" disabled={save.isPending} className="mt-8 h-10 px-4 font-bold">
        {save.isPending ? 'Salvando…' : 'Salvar carteira'}
      </Button>
    </form>
  )
}
