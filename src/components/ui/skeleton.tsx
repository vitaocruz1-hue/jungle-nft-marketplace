import { cn } from 'cn'

/**
 * Bloco de carregamento com brilho (shimmer) que atravessa da direita para a
 * esquerda. Com "reduzir movimento" ativo no sistema, fica estático.
 * É decorativo: quem anuncia o carregamento é o contêiner (aria-busy).
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-md bg-[length:200%_100%]',
        'bg-[linear-gradient(90deg,var(--card)_0%,var(--muted)_50%,var(--card)_100%)]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
