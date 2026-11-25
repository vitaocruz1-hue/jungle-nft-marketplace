import { notifyComingSoon } from '@/lib/coming-soon'
import { cn } from '@/lib/utils'

type ComingSoonButtonProps = React.ComponentProps<'button'> & {
  /** Nome da seção, usado no aviso. */
  section: string
}

/** Botão com aparência de link para áreas fora do escopo (editorial, ajuda...). */
export function ComingSoonButton({
  section,
  className,
  children,
  ...props
}: ComingSoonButtonProps) {
  return (
    <button
      type="button"
      className={cn('cursor-pointer text-left', className)}
      onClick={() => notifyComingSoon(section)}
      {...props}
    >
      {children}
    </button>
  )
}
