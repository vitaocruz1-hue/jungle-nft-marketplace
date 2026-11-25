import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'

import { NotFound } from '@/components/not-found'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <NotFound />,
})

function RootLayout() {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2"
      >
        Pular para o conteúdo
      </a>

      {/* Cabeçalho provisório: será substituído pelo do Figma. */}
      <header className="border-b">
        <nav aria-label="Principal" className="mx-auto flex h-16 max-w-7xl items-center px-4">
          <Link to="/" className="text-lg font-bold">
            NFT Marketplace
          </Link>
        </nav>
      </header>

      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-8 outline-none">
        <Outlet />
      </main>
    </>
  )
}
