import { useRouter } from '@tanstack/react-router'
import { ChevronLeftIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * "Voltar" redondo do layout mobile. Volta no histórico; se a página foi
 * aberta direto (sem histórico no app), vai para `fallback`.
 */
export function BackButton({
  fallback = '/',
  label = 'Voltar',
  className,
}: {
  fallback?: '/' | '/carrinho'
  label?: string
  className?: string
}) {
  const router = useRouter()
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        if (router.history.canGoBack()) router.history.back()
        else void router.navigate({ to: fallback })
      }}
      className={cn(
        'grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-[#2f1d15] text-highlight transition-colors hover:bg-secondary',
        className,
      )}
    >
      <ChevronLeftIcon aria-hidden="true" className="size-5" />
    </button>
  )
}
