import { createFileRoute } from '@tanstack/react-router'
import { ImageIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AVATAR_MAX_BYTES,
  EMAIL_PATTERN,
  USERNAME_PATTERN,
  validatePassword,
  type User,
} from '@/contracts/auth'
import { ENS_NAME_PATTERN } from '@/contracts/wallets'
import { useSession } from '@/features/auth/session'
import { ProfileLayout } from '@/features/profile/components/profile-layout'
import {
  useChangePassword,
  useRemoveAvatar,
  useUpdateAvatar,
  useUpdateProfile,
} from '@/features/profile/queries'
import { ApiError, getErrorMessage } from '@/lib/api-error'
import { focusFirstError } from '@/lib/forms'

export const Route = createFileRoute('/_auth/perfil')({
  head: () => ({ meta: [{ title: 'Meu perfil · Kurio' }] }),
  component: ProfilePage,
})

function handleFormError(
  error: unknown,
  form: HTMLFormElement | null,
  setErrors: (errors: Record<string, string>) => void,
) {
  if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
    setErrors(error.fieldErrors)
    focusFirstError(form, error.fieldErrors)
  } else {
    toast.error('Não foi possível salvar', { description: getErrorMessage(error) })
  }
}

function ProfileForm({ user }: { user: User }) {
  const formRef = useRef<HTMLFormElement>(null)
  const update = useUpdateProfile()
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = (name: string) => String(data.get(name) ?? '').trim()
    const body = {
      displayName: text('displayName'),
      username: text('username').toLowerCase(),
      email: text('email'),
      ensName: text('ensName')
        .toLowerCase()
        .replace(/\.eth$/, ''),
      walletNickname: text('walletNickname'),
    }
    const found: Record<string, string> = {}
    if (!body.displayName) found.displayName = 'Informe o nome de exibição.'
    if (!USERNAME_PATTERN.test(body.username))
      found.username = 'Use 3 a 30 caracteres: letras minúsculas, números, ponto ou _.'
    if (!EMAIL_PATTERN.test(body.email)) found.email = 'Informe um e-mail válido.'
    if (!ENS_NAME_PATTERN.test(body.ensName))
      found.ensName = 'Use de 3 a 40 letras minúsculas, números ou hífen.'
    if (!body.walletNickname) found.walletNickname = 'Informe o apelido da carteira.'
    setErrors(found)
    if (Object.keys(found).length > 0) return focusFirstError(formRef.current, found)

    update.mutate(body, {
      onSuccess: () => toast.success('Perfil atualizado.'),
      onError: (error) => handleFormError(error, formRef.current, setErrors),
    })
  }

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} aria-labelledby="perfil-titulo">
      <h1 id="perfil-titulo" className="text-base font-bold">
        Perfil do colecionador
      </h1>
      <div className="mt-8 grid gap-x-7 gap-y-6 md:grid-cols-2">
        <FormField
          id="perfil-nome"
          name="displayName"
          label="Nome de exibição"
          required
          defaultValue={user.displayName}
          error={errors.displayName}
          autoComplete="name"
        />
        <FormField
          id="perfil-usuario"
          name="username"
          label="Nome de usuário"
          required
          defaultValue={user.username}
          error={errors.username}
          autoComplete="username"
        />
        <FormField
          id="perfil-email"
          name="email"
          type="email"
          label="E-mail"
          required
          defaultValue={user.email}
          error={errors.email}
          autoComplete="email"
        />
        <FormField
          id="perfil-ens"
          name="ensName"
          label="Nome ENS (sem .eth)"
          required
          defaultValue={user.ensName}
          error={errors.ensName}
        />
        <FormField
          id="perfil-apelido"
          name="walletNickname"
          label="Apelido da carteira"
          required
          defaultValue={user.walletNickname}
          error={errors.walletNickname}
        />
        <AvatarField user={user} />
      </div>
      <Button type="submit" disabled={update.isPending} className="mt-8 h-10 w-[130px] font-bold">
        {update.isPending ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}

function AvatarField({ user }: { user: User }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const update = useUpdateAvatar()
  const remove = useRemoveAvatar()
  const [error, setError] = useState<string | null>(null)

  function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    if (!file.type.startsWith('image/')) return setError('Escolha um arquivo de imagem.')
    if (file.size > AVATAR_MAX_BYTES) return setError('A imagem deve ter até 1 MB.')
    const reader = new FileReader()
    reader.onload = () =>
      update.mutate(String(reader.result), {
        onSuccess: () => toast.success('Avatar atualizado.'),
        onError: (e) => setError(getErrorMessage(e)),
      })
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <Label htmlFor="perfil-avatar" className="mb-2 text-sm font-normal">
        Avatar
      </Label>
      <div className="flex items-center gap-6">
        <span className="grid size-[50px] shrink-0 place-items-center overflow-hidden rounded-full bg-secondary">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`Avatar de ${user.displayName}`}
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon aria-hidden="true" className="size-6 text-highlight" />
          )}
        </span>
        <Input
          ref={inputRef}
          id="perfil-avatar"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          aria-describedby={error ? 'perfil-avatar-erro' : 'perfil-avatar-dica'}
          onChange={(e) => {
            handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <Button
          type="button"
          disabled={update.isPending}
          onClick={() => inputRef.current?.click()}
          className="h-10 px-6 font-bold"
        >
          {update.isPending ? 'Enviando…' : 'Alterar'}
        </Button>
        {user.avatarUrl && (
          <button
            type="button"
            disabled={remove.isPending}
            className="cursor-pointer text-sm hover:text-highlight"
            onClick={() =>
              remove.mutate(undefined, { onSuccess: () => toast.success('Avatar removido.') })
            }
          >
            Remover
          </button>
        )}
      </div>
      <p id="perfil-avatar-dica" className="mt-1.5 text-xs text-muted-foreground">
        PNG, JPG, WebP ou GIF de até 1 MB.
      </p>
      {error && (
        <p
          id="perfil-avatar-erro"
          role="alert"
          className="mt-1.5 text-xs font-semibold text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}

function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const change = useChangePassword()
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const currentPassword = String(data.get('currentPassword') ?? '')
    const newPassword = String(data.get('newPassword') ?? '')
    const confirm = String(data.get('confirm') ?? '')
    const found: Record<string, string> = {}
    if (!currentPassword) found.currentPassword = 'Informe a senha atual.'
    const passwordError = validatePassword(newPassword)
    if (passwordError) found.newPassword = passwordError
    if (confirm !== newPassword) found.confirm = 'As senhas não conferem.'
    setErrors(found)
    if (Object.keys(found).length > 0) return focusFirstError(formRef.current, found)

    change.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success('Senha alterada.')
          form.reset()
        },
        onError: (error) => handleFormError(error, formRef.current, setErrors),
      },
    )
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      aria-labelledby="senha-titulo"
      className="mt-12 max-w-[417px]"
    >
      <h2 id="senha-titulo" className="text-base font-bold">
        Alterar senha
      </h2>
      <div className="mt-6 space-y-5">
        <FormField
          id="senha-atual"
          name="currentPassword"
          type="password"
          label="Senha atual"
          autoComplete="current-password"
          error={errors.currentPassword}
        />
        <FormField
          id="senha-nova"
          name="newPassword"
          type="password"
          label="Nova senha"
          autoComplete="new-password"
          hint="Mínimo de 8 caracteres, com letras e números."
          error={errors.newPassword}
        />
        <FormField
          id="senha-confirmar"
          name="confirm"
          type="password"
          label="Confirmar nova senha"
          autoComplete="new-password"
          error={errors.confirm}
        />
      </div>
      <Button type="submit" disabled={change.isPending} className="mt-8 h-10 px-6 font-bold">
        {change.isPending ? 'Salvando…' : 'Salvar nova senha'}
      </Button>
    </form>
  )
}

function ProfilePage() {
  const { user } = useSession()
  return (
    <ProfileLayout>
      {user && <ProfileForm key={user.id} user={user} />}
      <PasswordForm />
    </ProfileLayout>
  )
}
