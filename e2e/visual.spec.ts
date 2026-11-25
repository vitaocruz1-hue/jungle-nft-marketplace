import { expect, test, type Page } from '@playwright/test'

import { login } from './support/auth'

/**
 * Regressão visual (@visual) das telas principais, com dados determinísticos
 * dos mocks. Baselines versionadas em e2e/visual.spec.ts-snapshots/.
 * Rodar: npm run test:visual  ·  Atualizar: npm run test:visual:update
 */

// Esconde avisos (toasts), que dependem do tempo, e espera imagens/fontes.
async function stable(page: Page) {
  await page.addStyleTag({ content: '[data-sonner-toaster]{display:none !important}' })
  await page.evaluate(() => document.fonts.ready)
  // A foto é da página inteira: carrega já as imagens com loading="lazy".
  await page.evaluate(() => {
    document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => {
      img.loading = 'eager'
    })
  })
  // Só imagens visíveis (cópias escondidas por breakpoint não carregam).
  await page.waitForFunction(() =>
    Array.from(document.images)
      .filter((img) => img.getClientRects().length > 0)
      .every((img) => img.complete && img.naturalWidth > 0),
  )
}

const options = { fullPage: true, animations: 'disabled', maxDiffPixelRatio: 0.01 } as const

test.describe('Regressão visual @visual', () => {
  test('início', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('list', { name: 'Resultados do catálogo' })).toBeVisible()
    await stable(page)
    await expect(page).toHaveScreenshot('inicio.png', options)
  })

  test('detalhe do NFT', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { name: 'Mais desta coleção' })).toBeVisible()
    await stable(page)
    await expect(page).toHaveScreenshot('detalhe.png', options)
  })

  test('carrinho', async ({ page }) => {
    for (const id of ['emerald-ape-042', 'violet-nomad-314']) {
      await page.goto(`/nft/${id}`)
      await page.getByRole('button', { name: 'Comprar', exact: true }).click()
      await expect(page).toHaveURL('/carrinho')
    }
    await expect(page.getByRole('heading', { name: 'Colecionadores também viram' })).toBeVisible()
    await stable(page)
    await expect(page).toHaveScreenshot('carrinho.png', options)
  })

  test('pagamento', async ({ page }) => {
    await page.goto('/')
    await login(page, 'ana@kurio.dev', 'Kurio@123')
    await page.goto('/nft/emerald-ape-042')
    await page.getByRole('button', { name: 'Comprar', exact: true }).click()
    await expect(page).toHaveURL('/carrinho')
    await page.goto('/pagamento')
    await expect(page.getByRole('button', { name: 'Revisar pedido' })).toBeVisible()
    await stable(page)
    await expect(page).toHaveScreenshot('pagamento.png', options)
  })
})
