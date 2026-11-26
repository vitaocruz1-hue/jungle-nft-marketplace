import { expect, test, type Page } from '@playwright/test'

import { isMobile, login, logout, USERS } from './support/auth'
import { mocks, useScenario } from './support/mocks'

const ordersList = (page: Page) => page.getByRole('list', { name: 'Seus pedidos' })

/** Desktop: "Meus pedidos" no menu do usuário. Celular: "Minha coleção" no rodapé. */
async function openOrders(page: Page) {
  if (isMobile(page)) {
    await page.getByRole('contentinfo').getByRole('link', { name: 'Minha coleção' }).click()
  } else {
    await page
      .getByRole('banner')
      .getByRole('button', { name: /Conta de/ })
      .click()
    await page.getByRole('menuitem', { name: 'Meus pedidos' }).click()
  }
  await expect(page).toHaveURL(/\/pedidos$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Meus pedidos' })).toBeVisible()
}

/** Compra um NFT pelo fluxo normal e devolve o id do pedido criado. */
async function buy(page: Page, nftId = 'emerald-ape-042') {
  await page.goto(`/nft/${nftId}`)
  await page.getByRole('button', { name: /^Comprar( NFT)?$/ }).click()
  await expect(page).toHaveURL('/carrinho')
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page).toHaveURL(/\/pedido\/ord-\d+$/)
  return page.url().split('/').pop()!
}

test.describe('Meus pedidos', () => {
  test('sem pedidos mostra o estado vazio', async ({ page }) => {
    await page.goto('/')
    await login(page, USERS.bruno.email, USERS.bruno.password)
    await openOrders(page)
    await expect(page.getByText('Você ainda não fez nenhum pedido')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explorar NFTs' })).toBeVisible()
  })

  test('pedido aparece pendente, o status muda ao vivo e a linha abre o pedido', async ({
    page,
  }) => {
    await page.goto('/')
    // Segura a confirmação: o teste decide quando a "rede" confirma.
    await mocks(page, (c) => c.setSettlementDelay(10 * 60_000))
    await login(page, USERS.ana.email, USERS.ana.password)
    const orderId = await buy(page)

    await openOrders(page)
    const row = ordersList(page).getByRole('link').filter({ hasText: 'Emerald Ape #042' })
    await expect(row).toHaveCount(1)
    await expect(row).toContainText('Pendente')
    await expect(row).toContainText('1 item')

    // A confirmação chega só pelo Socket.IO (order.updated), sem recarregar a página.
    await expect.poll(() => mocks(page, (c) => c.connectedClients())).toBeGreaterThan(0)
    await mocks(page, (c) => c.settlePendingOrders())
    await expect(row).toContainText('Confirmado')
    await expect(page.getByText(`Pedido ${orderId}: confirmado.`)).toBeAttached()

    await row.click()
    await expect(page).toHaveURL(new RegExp(`/pedido/${orderId}$`))
    await expect(
      page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible()
  })

  test('pagamento recusado aparece como "Recusado"', async ({ page }) => {
    await useScenario(page, 'pagamento-recusado')
    await page.goto('/')
    await login(page, USERS.ana.email, USERS.ana.password)
    await buy(page)
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({
      timeout: 10_000,
    })
    await openOrders(page)
    await expect(ordersList(page).getByRole('link')).toContainText(['Recusado'])
  })

  test('pedidos de um usuário não aparecem para outro', async ({ page }) => {
    await page.goto('/')
    await login(page, USERS.ana.email, USERS.ana.password)
    await buy(page)
    await page.goto('/pedidos')
    await expect(ordersList(page).getByRole('link')).toHaveCount(1)

    await logout(page)
    await expect(page.getByText('Você saiu da sua conta.')).toBeVisible()
    await login(page, USERS.bruno.email, USERS.bruno.password)
    await openOrders(page)
    await expect(page.getByText('Você ainda não fez nenhum pedido')).toBeVisible()
  })

  test('erro ao carregar mostra "Tentar novamente" e se recupera', async ({ page }) => {
    await useScenario(page, 'erro-servidor')
    await page.goto('/pedidos')
    await expect(page).toHaveURL(/\/login\?redirect=%2Fpedidos/)
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(USERS.ana.email)
    await page.getByLabel('Senha', { exact: true }).fill(USERS.ana.password)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Não foi possível carregar seus pedidos' }),
    ).toBeVisible({ timeout: 15_000 })

    await page.evaluate(() => sessionStorage.setItem('kurio:mock-scenario', 'padrao'))
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByText('Você ainda não fez nenhum pedido')).toBeVisible()
  })
})
