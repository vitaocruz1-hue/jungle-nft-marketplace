import { expect, test, type Page } from '@playwright/test'

import { login, USERS } from './support/auth'

/**
 * Nenhuma página pode rolar na horizontal: celular (390), tablet (768) e
 * desktop (1440), com e sem login. Roda no projeto desktop (as larguras são
 * trocadas aqui); o projeto mobile confere a própria largura (Pixel 7, 390 px).
 */

const PUBLIC_ROUTES = [
  '/',
  '/nft/emerald-ape-042',
  '/nft/nao-existe',
  '/carrinho',
  '/login',
  '/cadastro',
  '/rota-inexistente',
]

const PRIVATE_ROUTES = [
  '/',
  '/nft/emerald-ape-042',
  '/carrinho',
  '/pagamento',
  '/perfil',
  '/carteiras',
  '/favoritos',
  '/pedidos',
]

function widthsFor(page: Page, projectName: string) {
  return projectName === 'mobile' ? [page.viewportSize()?.width ?? 390] : [390, 768, 1440]
}

async function expectNoHorizontalScroll(page: Page, route: string, width: number) {
  // Página carregada: título principal visível e nenhuma requisição pendente.
  await expect(
    page.getByRole('heading', { level: 1 }).first(),
    `${route} em ${width}px: página sem título principal`,
  ).toBeAttached()
  await page.waitForLoadState('networkidle')
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(
    scrollWidth,
    `${route} em ${width}px: scrollWidth ${scrollWidth} > clientWidth ${clientWidth}`,
  ).toBeLessThanOrEqual(clientWidth)
}

async function visitAll(page: Page, routes: string[], widths: number[]) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of routes) {
      await page.goto(route)
      await expectNoHorizontalScroll(page, route, width)
    }
  }
}

/** Compra um NFT (cria o pedido) e deixa outro no carrinho (libera /pagamento). */
async function prepareAccount(page: Page) {
  await page.goto('/nft/emerald-ape-042')
  await page.getByRole('button', { name: /^Comprar( NFT)?$/ }).click()
  await expect(page).toHaveURL('/carrinho')
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/pedido\/ord-\d+$/)
  const orderPath = new URL(page.url()).pathname

  await page.goto('/nft/sage-nomad-009')
  await page.getByRole('button', { name: /^Comprar( NFT)?$/ }).click()
  await expect(page).toHaveURL('/carrinho')
  return orderPath
}

test.describe('Sem rolagem horizontal', () => {
  // Muitas páginas por teste (até 3 larguras × 9 rotas): mais tempo que o padrão.
  test.describe.configure({ timeout: 180_000 })

  test('rotas públicas em 390, 768 e 1440 px', async ({ page }, testInfo) => {
    await visitAll(page, PUBLIC_ROUTES, widthsFor(page, testInfo.project.name))
  })

  test('rotas logadas (inclui recibo do pedido) em 390, 768 e 1440 px', async ({
    page,
  }, testInfo) => {
    const widths = widthsFor(page, testInfo.project.name)
    await page.goto('/')
    await login(page, USERS.ana.email, USERS.ana.password)
    const orderPath = await prepareAccount(page)
    await visitAll(page, [...PRIVATE_ROUTES, orderPath], widths)
  })
})
