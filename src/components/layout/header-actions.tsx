import { Link, useRouterState } from '@tanstack/react-router'
import {
  HeartIcon,
  LogInIcon,
  LogOutIcon,
  PackageIcon,
  ShoppingCartIcon,
  UserIcon,
  WalletIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLogout } from '@/features/auth/hooks'
import { useSession } from '@/features/auth/session'
import { useCart } from '@/features/cart/queries'
import { useFavoritesList } from '@/features/favorites/queries'
import { useBumpOnIncrease } from '@/lib/use-bump'
import { cn } from '@/lib/utils'

/** Página atual, para voltar a ela depois do login. */
function useCurrentHref() {
  return useRouterState({ select: (state) => state.location.href })
}

/** Contador sobre o ícone (carrinho e favoritos). Some quando é 0. */
function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span
      aria-hidden="true"
      className="absolute top-0.5 right-0 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-none font-bold text-primary-foreground"
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

/**
 * Atalho para os favoritos (só desktop; no celular fica na barra de abas).
 * Desvio do Figma: o ícone não existe no frame. Sem login, vai direto ao login
 * e volta para /favoritos depois.
 */
export function FavoritesLink() {
  const { user } = useSession()
  const { data } = useFavoritesList()
  const count = user ? (data?.nftIds.length ?? 0) : 0
  const label = `Favoritos (${count})`
  const content = (
    <>
      <HeartIcon className="size-5 lg:size-6" />
      <CountBadge count={count} />
    </>
  )

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="relative hidden hover:bg-secondary md:inline-flex"
    >
      {user ? (
        <Link to="/favoritos" aria-label={label}>
          {content}
        </Link>
      ) : (
        <Link to="/login" search={{ redirect: '/favoritos' }} aria-label={label}>
          {content}
        </Link>
      )}
    </Button>
  )
}

export function CartLink() {
  const { data } = useCart()
  const count = data?.itemCount ?? 0
  const bumps = useBumpOnIncrease(data?.itemCount)
  const label =
    count > 0 ? `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}` : 'Carrinho vazio'

  return (
    <Button asChild variant="ghost" size="icon" className="relative hover:bg-secondary">
      <Link to="/carrinho" aria-label={label}>
        <ShoppingCartIcon
          key={bumps}
          className={cn('size-5 lg:size-6', bumps > 0 && 'cart-bump')}
        />
        <CountBadge count={count} />
      </Link>
    </Button>
  )
}

export function AccountButton({ className }: { className?: string }) {
  const { user, isLoading } = useSession()
  const logout = useLogout()
  const href = useCurrentHref()

  if (isLoading) return <span className={cn('h-9 w-24', className)} aria-hidden="true" />

  if (!user) {
    return (
      <Button
        asChild
        className={cn('h-9 px-3 text-base lg:h-[35px] lg:has-[>svg]:px-[7px]', className)}
      >
        <Link to="/login" search={{ redirect: href.startsWith('/login') ? undefined : href }}>
          <LogInIcon className="size-5" />
          Entrar
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('h-9 max-w-44 border-primary bg-transparent px-2 text-sm', className)}
          aria-label={`Conta de ${user.displayName}`}
        >
          <span
            aria-hidden="true"
            className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          >
            {user.displayName.charAt(0).toUpperCase()}
          </span>
          {/* Entre 768 e 1023 px o menu principal divide a linha: só a inicial cabe. */}
          <span className="truncate md:max-lg:hidden">{user.username}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/perfil">
            <UserIcon /> Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/favoritos">
            <HeartIcon /> Favoritos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/pedidos">
            <PackageIcon /> Meus pedidos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/carteiras">
            <WalletIcon /> Carteiras
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logout.mutate()} disabled={logout.isPending}>
          <LogOutIcon /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
