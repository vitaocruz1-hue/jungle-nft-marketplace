import { Link, useRouterState } from '@tanstack/react-router'
import {
  DownloadIcon,
  HeartIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MapPinIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  UserIcon,
} from 'lucide-react'

import { Container } from '@/components/layout/container'
import { useLogout } from '@/features/auth/hooks'
import { notifyComingSoon } from '@/lib/coming-soon'
import { cn } from '@/lib/utils'

const itemClass =
  'relative flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-sm text-highlight transition-colors hover:bg-secondary'
const activeClass = 'before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary'

/** Itens do menu do Figma: os que têm tela viram links; os outros mostram "em breve". */
const MORE_ITEMS = [
  { label: 'Atividade', icon: ShoppingCartIcon, to: '/pedidos' },
  { label: 'Lista de interesse', icon: HeartIcon, to: '/favoritos' },
  { label: 'Ofertas', icon: TrendingUpIcon },
  { label: 'Arquivos baixados', icon: DownloadIcon },
  { label: 'Suporte', icon: LifeBuoyIcon },
] as const

interface ProfileLayoutProps {
  children: React.ReactNode
  /** Favoritos e pedidos abrem direto no conteúdo no celular (o menu fica no Perfil). */
  menuOnMobile?: boolean
}

/** Layout "Meu perfil": menu lateral + conteúdo (Perfil, Carteiras, Favoritos, Pedidos). */
export function ProfileLayout({ children, menuOnMobile = true }: ProfileLayoutProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const logout = useLogout()

  return (
    <Container className="grid gap-8 pt-8 lg:grid-cols-[310px_minmax(0,1fr)]">
      <nav
        aria-labelledby="menu-perfil-titulo"
        className={cn('self-start bg-card py-3', !menuOnMobile && 'max-md:hidden')}
      >
        <h2 id="menu-perfil-titulo" className="px-3 pb-2 type-heading">
          Meu perfil
        </h2>
        <ul>
          <li>
            <Link
              to="/perfil"
              aria-current={pathname === '/perfil' ? 'page' : undefined}
              className={cn(itemClass, pathname === '/perfil' && activeClass)}
            >
              <UserIcon aria-hidden="true" className="size-4" /> Dados do perfil
            </Link>
          </li>
          <li>
            <Link
              to="/carteiras"
              aria-current={pathname === '/carteiras' ? 'page' : undefined}
              className={cn(itemClass, pathname === '/carteiras' && activeClass)}
            >
              <MapPinIcon aria-hidden="true" className="size-4" /> Carteiras
            </Link>
          </li>
          {MORE_ITEMS.map((item) => {
            const Icon = item.icon
            if ('to' in item) {
              const active = pathname === item.to
              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={cn(itemClass, active && activeClass)}
                  >
                    <Icon aria-hidden="true" className="size-4" /> {item.label}
                  </Link>
                </li>
              )
            }
            return (
              <li key={item.label}>
                <button
                  type="button"
                  className={itemClass}
                  onClick={() => notifyComingSoon(item.label)}
                >
                  <Icon aria-hidden="true" className="size-4" /> {item.label}
                </button>
              </li>
            )
          })}
          <li className="border-t border-[#3d2a1f]">
            <button
              type="button"
              className={cn(itemClass, 'font-bold')}
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOutIcon aria-hidden="true" className="size-4" /> Sair
            </button>
          </li>
        </ul>
      </nav>
      <div className="min-w-0">{children}</div>
    </Container>
  )
}
