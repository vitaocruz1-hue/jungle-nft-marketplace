import { cn } from '@/lib/utils'

/** Largura do layout do Figma: 1200px de conteúdo (120px de margem em 1440px). */
export function Container({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-[1240px] px-5', className)} {...props} />
}
