import { expect, test, type Page } from '@playwright/test'

import { results } from './support/catalog'
import { mocks } from './support/mocks'

/** Espera o Socket.IO conectar: os eventos só chegam com a conexão aberta. */
async function waitForSocket(page: Page) {
  await expect.poll(() => mocks(page, (m) => m.connectedClients())).toBe(1)
}

const toasts = (page: Page) => page.locator('[data-sonner-toast]')

test.describe('Tempo real visível', () => {
  test('preço de um NFT na tela: aviso com valor antigo e novo e destaque breve no preço', async ({
    page,
  }) => {
    await page.goto('/')
    const card = results(page).locator('article', { hasText: 'Emerald Ape #042' })
    const price = card.locator('p > span').first()
    await expect(price).toContainText('1.19 ETH')
    await waitForSocket(page)

    await mocks(page, (m) => m.changeNftPrice('emerald-ape-042', '2.50'))
    await expect(
      toasts(page).filter({ hasText: 'Preço do Emerald Ape #042 mudou de 1.19 para 2.50 ETH.' }),
    ).toBeVisible()
    await expect(price).toContainText('2.50 ETH')
    await expect(price).toHaveClass(/price-flash/)
    // O destaque é breve: some sozinho.
    await expect(price).not.toHaveClass(/price-flash/, { timeout: 5_000 })
  })

  test('NFT esgotado na tela avisa "esgotou"', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await waitForSocket(page)

    await mocks(page, (m) => m.sellOut('emerald-ape-042'))
    await expect(toasts(page).filter({ hasText: 'Emerald Ape #042 esgotou.' })).toBeVisible()
    await expect(page.getByText('Todas as edições deste NFT estão esgotadas.')).toBeVisible()
  })

  test('NFT no carrinho: aviso cita a edição e o preço da linha acende', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    await page.getByRole('button', { name: /^Comprar( NFT)?$/ }).click()
    await expect(page).toHaveURL('/carrinho')
    await waitForSocket(page)

    await mocks(page, (m) => m.changeNftPrice('emerald-ape-042', '1.50'))
    await expect(
      toasts(page).filter({
        hasText: 'Preço do Emerald Ape #042 (edição 1/50) mudou de 1.19 para 1.50 ETH.',
      }),
    ).toBeVisible()
    await expect(page.locator('.price-flash').filter({ visible: true }).first()).toBeVisible()
  })

  test('mudança de NFT que não está na tela nem no carrinho não gera aviso', async ({ page }) => {
    await page.goto('/')
    await expect(results(page)).toContainText('Emerald Ape #042')
    await waitForSocket(page)

    // Sai do catálogo sem recarregar (a conexão e o cache continuam).
    await page.getByRole('link', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(/\/login/)
    await mocks(page, (m) => m.changeNftPrice('emerald-ape-042', '2.75'))

    // O evento chegou (o cache foi atualizado), mas ninguém estava vendo o NFT.
    await page.goBack()
    await expect(results(page).locator('article', { hasText: 'Emerald Ape #042' })).toContainText(
      '2.75 ETH',
    )
    await expect(toasts(page).filter({ hasText: 'mudou de' })).toHaveCount(0)
  })
})
