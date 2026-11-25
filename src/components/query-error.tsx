import { AlertTriangleIcon, RotateCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'

interface QueryErrorProps {
  error: unknown
  onRetry: () => void
  isRetrying?: boolean
  title?: string
  className?: string
}

/** Falha ao carregar dados, com opção de tentar de novo. */
export function QueryError({
  error,
  onRetry,
  isRetrying = false,
  title = 'Não foi possível carregar',
  className,
}: QueryErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-3 rounded-md border border-destructive/50 bg-card px-6 py-10 text-center',
        className,
      )}
    >
      <AlertTriangleIcon aria-hidden="true" className="size-8 text-destructive" />
      <p className="text-lg font-bold">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{getErrorMessage(error)}</p>
      <Button onClick={onRetry} disabled={isRetrying} className="mt-2">
        <RotateCwIcon className={cn(isRetrying && 'motion-safe:animate-spin')} />
        {isRetrying ? 'Tentando…' : 'Tentar novamente'}
      </Button>
    </div>
  )
}
