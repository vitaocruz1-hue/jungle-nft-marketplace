import { useRef, useState } from 'react'

import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { EMAIL_PATTERN, USERNAME_PATTERN, validatePassword } from '@/contracts/auth'
import { ApiError } from '@/lib/api-error'
import { focusFirstError } from '@/lib/forms'

import { useRegister } from '../hooks'

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const formRef = useRef<HTMLFormElement>(null)
  const register = useRegister()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const username = String(data.get('username') ?? '')
      .trim()
      .toLowerCase()
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')
    const confirm = String(data.get('confirm') ?? '')

    const errors: Record<string, string> = {}
    if (!USERNAME_PATTERN.test(username))
      errors.username = 'Use 3 a 30 caracteres: letras minúsculas, números, ponto ou _.'
    if (!EMAIL_PATTERN.test(email)) errors.email = 'Informe um e-mail válido.'
    const passwordError = validatePassword(password)
    if (passwordError) errors.password = passwordError
    if (!confirm) errors.confirm = 'Confirme sua senha.'
    else if (confirm !== password) errors.confirm = 'As senhas não conferem.'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return focusFirstError(formRef.current, errors)

    register.mutate(
      { username, email, password },
      {
        onSuccess,
        onError: (error) => {
          // Ex.: 409 "e-mail já cadastrado" aparece embaixo do campo certo.
          if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
            setFieldErrors(error.fieldErrors)
            focusFirstError(formRef.current, error.fieldErrors)
          }
        },
      },
    )
  }

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="space-y-3">
      {register.error && (
        <p
          role="alert"
          className="rounded-sm border border-destructive/60 px-3 py-2 text-sm text-destructive"
        >
          {register.error.message}
        </p>
      )}
      <FormField
        id="cadastro-usuario"
        name="username"
        label="Nome de usuário"
        hideLabel
        placeholder="Nome de usuário"
        autoComplete="username"
        required
        error={fieldErrors.username}
      />
      <FormField
        id="cadastro-email"
        name="email"
        type="email"
        label="E-mail"
        hideLabel
        placeholder="Digite seu e-mail"
        autoComplete="email"
        required
        error={fieldErrors.email}
      />
      <FormField
        id="cadastro-senha"
        name="password"
        type="password"
        label="Senha"
        hideLabel
        placeholder="Senha"
        autoComplete="new-password"
        required
        hint="Mínimo de 8 caracteres, com letras e números."
        error={fieldErrors.password}
      />
      <FormField
        id="cadastro-confirmar"
        name="confirm"
        type="password"
        label="Confirmar senha"
        hideLabel
        placeholder="Confirmar senha"
        autoComplete="new-password"
        required
        error={fieldErrors.confirm}
      />
      <Button
        type="submit"
        disabled={register.isPending}
        className="mt-3 h-11 w-full text-base font-bold"
      >
        {register.isPending ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  )
}
