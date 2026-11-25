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

const COMING_SOON = [
  { label: 'Atividade', icon: ShoppingCartIcon },
  { label: 'Lista de interesse', icon: HeartIcon },
  { label: 'Ofertas', icon: TrendingUpIcon },
  { label: 'Arquivos baixados', icon: DownloadIcon },
  { label: 'Suporte', icon: LifeBuoyIcon },
]

/** Layout "Meu perfil": menu lateral + conteúdo (Perfil e Carteiras). */
export function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const logout = useLogout()

  return (
    <Container className="grid gap-8 pt-8 lg:grid-cols-[310px_minmax(0,1fr)]">
      <nav aria-labelledby="menu-perfil-titulo" className="self-start bg-card py-3">
        <h2 id="menu-perfil-titulo" className="px-3 pb-2 text-lg font-bold">
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
          {COMING_SOON.map(({ label, icon: Icon }) => (
            <li key={label}>
              <button type="button" className={itemClass} onClick={() => notifyComingSoon(label)}>
                <Icon aria-hidden="true" className="size-4" /> {label}
              </button>
            </li>
          ))}
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
