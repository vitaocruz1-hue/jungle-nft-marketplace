import { Link, useRouterState } from '@tanstack/react-router'
import { HeartIcon, HomeIcon, ScanSearchIcon, ShoppingCartIcon, UserIcon } from 'lucide-react'

import { useSession } from '@/features/auth/session'
import { useCart } from '@/features/cart/queries'
import { useBumpOnIncrease } from '@/lib/use-bump'
import { cn } from '@/lib/utils'

const itemClass =
  'relative grid size-12 place-items-center rounded-full text-muted-foreground transition-colors hover:text-highlight'

/** Leva à busca do catálogo (campo "Explorar coleções" no topo da Início). */
function focusSearch() {
  const input = document.getElementById('busca-mobile')
  if (input) {
    input.scrollIntoView({ block: 'center' })
    input.focus()
  }
}

/** Barra de abas inferior do layout mobile do Figma (só abaixo de 768 px). */
export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const href = useRouterState({ select: (s) => s.location.href })
  const { user } = useSession()
  const { data: cart } = useCart()
  const count = cart?.itemCount ?? 0
  const bumps = useBumpOnIncrease(cart?.itemCount)

  return (
    <nav aria-label="Navegação inferior" className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <ul className="relative mx-auto flex h-[76px] items-center justify-around rounded-t-[28px] border-t glass px-4 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(0_0_0/0.35)]">
        <li>
          <Link
            to="/"
            aria-label="Início"
            aria-current={pathname === '/' ? 'page' : undefined}
            className={cn(itemClass, pathname === '/' && 'text-highlight')}
          >
            <HomeIcon aria-hidden="true" className="size-6" />
          </Link>
        </li>
        <li>
          <Link
            to="/favoritos"
            aria-label="Favoritos"
            aria-current={pathname === '/favoritos' ? 'page' : undefined}
            className={cn(itemClass, pathname === '/favoritos' && 'text-highlight')}
          >
            <HeartIcon aria-hidden="true" className="size-6 fill-current" />
          </Link>
        </li>
        <li className="-mt-12">
          {pathname === '/' ? (
            <button
              type="button"
              aria-label="Buscar NFTs"
              onClick={focusSearch}
              className="grid size-16 cursor-pointer place-items-center rounded-full border-4 border-background bg-[linear-gradient(135deg,#d0884b,#8c5c34)] text-primary-foreground shadow-lg"
            >
              <ScanSearchIcon aria-hidden="true" className="size-7" />
            </button>
          ) : (
            <Link
              to="/"
              hash="busca-mobile"
              aria-label="Buscar NFTs"
              className="grid size-16 place-items-center rounded-full border-4 border-background bg-[linear-gradient(135deg,#d0884b,#8c5c34)] text-primary-foreground shadow-lg"
            >
              <ScanSearchIcon aria-hidden="true" className="size-7" />
            </Link>
          )}
        </li>
        <li>
          <Link
            to="/carrinho"
            aria-label={
              count > 0 ? `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}` : 'Carrinho vazio'
            }
            className={itemClass}
          >
            <ShoppingCartIcon
              key={bumps}
              aria-hidden="true"
              className={cn('size-6', bumps > 0 && 'cart-bump')}
            />
            {count > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-none font-bold text-primary-foreground"
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
        </li>
        <li>
          {user ? (
            <Link
              to="/perfil"
              aria-label={`Perfil de ${user.username}`}
              aria-current={pathname === '/perfil' ? 'page' : undefined}
              className={cn(itemClass, pathname.startsWith('/perfil') && 'text-highlight')}
            >
              <UserIcon aria-hidden="true" className="size-6 fill-current" />
            </Link>
          ) : (
            <Link
              to="/login"
              search={{ redirect: href.startsWith('/login') ? undefined : href }}
              aria-label="Entrar"
              className={itemClass}
            >
              <UserIcon aria-hidden="true" className="size-6 fill-current" />
            </Link>
          )}
        </li>
      </ul>
    </nav>
  )
}
