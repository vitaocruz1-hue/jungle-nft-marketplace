import { useRef, useState } from 'react'

import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { EMAIL_PATTERN } from '@/contracts/auth'
import { notifyComingSoon } from '@/lib/coming-soon'
import { ApiError } from '@/lib/api-error'
import { focusFirstError } from '@/lib/forms'

import { useLogin } from '../hooks'

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const formRef = useRef<HTMLFormElement>(null)
  const login = useLogin()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')

    const errors: Record<string, string> = {}
    if (!EMAIL_PATTERN.test(email)) errors.email = 'Informe um e-mail válido.'
    if (!password) errors.password = 'Informe sua senha.'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return focusFirstError(formRef.current, errors)

    login.mutate(
      { email, password },
      {
        onSuccess,
        onError: (error) => {
          if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
            setFieldErrors(error.fieldErrors)
            focusFirstError(formRef.current, error.fieldErrors)
          }
        },
      },
    )
  }

  const generalError =
    login.error && !(login.error instanceof ApiError && Object.keys(login.error.fieldErrors).length)
      ? login.error.message
      : null

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="space-y-4">
      {generalError && (
        <p
          role="alert"
          className="rounded-sm border border-destructive/60 px-3 py-2 text-sm text-destructive"
        >
          {generalError}
        </p>
      )}
      <FormField
        id="login-email"
        name="email"
        type="email"
        label="E-mail"
        hideLabel
        placeholder="contato@email.com"
        autoComplete="email"
        required
        error={fieldErrors.email}
      />
      <FormField
        id="login-senha"
        name="password"
        type="password"
        label="Senha"
        hideLabel
        placeholder="Senha"
        autoComplete="current-password"
        required
        error={fieldErrors.password}
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => notifyComingSoon('Recuperação de senha')}
          className="cursor-pointer text-sm text-highlight hover:underline"
        >
          Esqueceu a senha?
        </button>
      </div>
      <Button
        type="submit"
        disabled={login.isPending}
        className="h-11 w-full text-base font-bold max-md:h-14 max-md:rounded-[10px]"
      >
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Demonstração: <span className="text-foreground">ana@kurio.dev</span> ·{' '}
        <span className="text-foreground">Kurio@123</span>
      </p>
    </form>
  )
}
