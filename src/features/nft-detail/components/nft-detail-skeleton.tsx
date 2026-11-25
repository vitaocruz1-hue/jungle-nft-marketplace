import { Container } from '@/components/layout/container'
import { Skeleton } from '@/components/ui/skeleton'

/** Mesma estrutura do detalhe: nada "pula" quando os dados chegam. */
export function NftDetailSkeleton() {
  return (
    <Container className="pt-8" aria-busy="true" aria-label="Carregando NFT">
      <Skeleton className="h-5 w-32" />
      <div className="mt-3 grid gap-8 lg:grid-cols-[572px_minmax(0,1fr)]">
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:gap-7">
          <div className="flex gap-3 sm:flex-col sm:gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="size-20 sm:size-[100px]" />
            ))}
          </div>
          <div className="flex-1 rounded-md bg-card p-4 sm:max-w-[444px] sm:p-5">
            <Skeleton className="aspect-square w-full rounded-[20px]" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-1/2" />
        </div>
      </div>
    </Container>
  )
}
