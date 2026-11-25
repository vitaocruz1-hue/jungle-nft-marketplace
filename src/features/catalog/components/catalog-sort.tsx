import { useNavigate } from '@tanstack/react-router'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATALOG_SORTS, type CatalogSort } from '@/contracts/catalog'
import { cn } from '@/lib/utils'

const SORT_LABELS: Record<CatalogSort, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  'name-asc': 'Nome (A–Z)',
}

function isCatalogSort(value: string): value is CatalogSort {
  return (CATALOG_SORTS as readonly string[]).includes(value)
}

/** "Ordenar por" — na barra do catálogo (desktop) e na gaveta de filtros (celular). */
export function CatalogSort({
  value,
  id,
  className,
  triggerClassName,
}: {
  value: CatalogSort
  /** Prefixo único (a ordenação aparece em dois lugares). */
  id: string
  className?: string
  triggerClassName?: string
}) {
  const navigate = useNavigate({ from: '/' })
  const labelId = `${id}-rotulo`

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <span id={labelId} className="text-sm whitespace-nowrap sm:text-base">
        Ordenar por:
      </span>
      <Select
        value={value}
        onValueChange={(next) => {
          if (!isCatalogSort(next)) return
          void navigate({
            search: (prev) => ({ ...prev, sort: next, page: undefined }),
            resetScroll: false,
          })
        }}
      >
        <SelectTrigger
          aria-labelledby={labelId}
          className={cn(
            'h-9 min-w-0 border-0 bg-transparent px-2 text-sm shadow-none hover:bg-secondary sm:text-base',
            triggerClassName,
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {CATALOG_SORTS.map((sort) => (
            <SelectItem key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
