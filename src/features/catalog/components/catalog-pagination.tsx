import { Link } from '@tanstack/react-router'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const MAX_VISIBLE_PAGES = 5

/** Janela de até 5 números ao redor da página atual. */
function visiblePages(current: number, total: number) {
  const half = Math.floor(MAX_VISIBLE_PAGES / 2)
  const start = Math.max(1, Math.min(current - half, total - MAX_VISIBLE_PAGES + 1))
  const end = Math.min(total, start + MAX_VISIBLE_PAGES - 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

const itemClass =
  'grid size-[35px] place-items-center rounded-sm border border-border text-base transition-colors hover:border-primary hover:text-highlight'

/** Ao trocar de página, leva o usuário de volta ao topo da lista. */
function scrollToCatalog() {
  document.getElementById('catalogo')?.scrollIntoView({ block: 'start' })
}

export function CatalogPagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação do catálogo" className="mt-12 flex justify-end lg:mt-[88px]">
      <ul className="flex flex-wrap items-center gap-2">
        {page > 1 && (
          <li>
            <Link
              from="/"
              to="/"
              search={(prev) => ({ ...prev, page: page - 1 })}
              resetScroll={false}
              onClick={scrollToCatalog}
              aria-label="Página anterior"
              className={itemClass}
            >
              <ChevronLeftIcon className="size-5" />
            </Link>
          </li>
        )}
        {visiblePages(page, totalPages).map((n) => (
          <li key={n}>
            <Link
              from="/"
              to="/"
              search={(prev) => ({ ...prev, page: n })}
              resetScroll={false}
              onClick={scrollToCatalog}
              aria-label={`Página ${n}`}
              aria-current={n === page ? 'page' : undefined}
              className={cn(
                itemClass,
                n === page &&
                  'border-primary bg-primary font-bold text-primary-foreground hover:text-primary-foreground',
              )}
            >
              {n}
            </Link>
          </li>
        ))}
        {page < totalPages && (
          <li>
            <Link
              from="/"
              to="/"
              search={(prev) => ({ ...prev, page: page + 1 })}
              resetScroll={false}
              onClick={scrollToCatalog}
              aria-label="Próxima página"
              className={itemClass}
            >
              <ChevronRightIcon className="size-5" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
