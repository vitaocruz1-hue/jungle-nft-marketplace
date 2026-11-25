import { expect, test } from '@playwright/test'

test('página inicial carrega com a API simulada (MSW) ativa', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: /seja dono d/i })).toBeVisible()

  // O app só renderiza depois que o service worker do MSW assume a página.
  const workerUrl = await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)
  expect(workerUrl).toContain('/mockServiceWorker.js')
})

test('rota inexistente mostra a página 404 e permite voltar ao início', async ({ page }) => {
  await page.goto('/rota-que-nao-existe')

  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()

  await page.getByRole('link', { name: 'Voltar para o início' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { level: 1, name: /seja dono d/i })).toBeVisible()
})
