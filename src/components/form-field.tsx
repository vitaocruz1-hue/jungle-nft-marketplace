import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type FormFieldProps = Omit<React.ComponentProps<'input'>, 'id'> & {
  id: string
  label: string
  /** Mensagem de erro (associada ao campo via aria-describedby). */
  error?: string
  hint?: string
  /** O Figma usa só placeholder: o rótulo fica visível apenas para leitores de tela. */
  hideLabel?: boolean
}

/** Campo de formulário acessível: rótulo, dica e erro ligados ao input. */
export function FormField({
  id,
  label,
  error,
  hint,
  hideLabel = false,
  type = 'text',
  className,
  ...props
}: FormFieldProps) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const describedBy = [hint && `${id}-dica`, error && `${id}-erro`].filter(Boolean).join(' ')

  return (
    <div className={className}>
      <Label htmlFor={id} className={cn('mb-2 text-sm font-normal', hideLabel && 'sr-only')}>
        {label}
        {props.required && !hideLabel && (
          <span aria-hidden="true" className="-ml-1 text-base text-highlight">
            *
          </span>
        )}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            'h-10 rounded-sm border-[#3d2a1f] bg-card px-4 text-sm placeholder:text-muted-foreground/90',
            isPassword && 'pr-11',
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            aria-controls={id}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-sm text-muted-foreground hover:text-foreground"
          >
            {visible ? <EyeIcon className="size-5" /> : <EyeOffIcon className="size-5" />}
          </button>
        )}
      </div>
      {hint && (
        <p id={`${id}-dica`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-erro`} className="mt-1.5 text-xs font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
