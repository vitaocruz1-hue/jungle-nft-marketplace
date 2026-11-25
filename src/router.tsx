import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    // Disponível em todas as rotas (ex.: para carregar dados no `loader`).
    context: { queryClient },
    // Começa a carregar a próxima página quando o mouse passa sobre o link.
    defaultPreload: 'intent',
    // Quem decide se o dado está "velho" é o TanStack Query, não o Router.
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })
}

// Faz o TypeScript conhecer todas as rotas: links para rotas inexistentes viram erro.
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
