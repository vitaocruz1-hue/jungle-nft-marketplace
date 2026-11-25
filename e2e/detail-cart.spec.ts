import { expect, test, type Page } from '@playwright/test'

import { isMobile, login } from './support/auth'

async function addToCart(
  page: Page,
  nftId: string,
  { edition, quantity = 1 }: { edition?: string; quantity?: number } = {},
) {
  await page.goto(`/nft/${nftId}`)
  if (edition) await page.getByRole('radio', { name: edition }).click()
  for (let i = 1; i < quantity; i++)
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page.getByRole('button', { name: /^Comprar( NFT)?$/ }).click()
  await expect(page).toHaveURL('/carrinho')
}

function cartItem(page: Page, name: string) {
  return page.getByRole('listitem').filter({ has: page.getByRole('link', { name }) })
}

test.describe('Detalhe do NFT', () => {
  test('acesso direto mostra os dados do NFT', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page).toHaveTitle('Emerald Ape #042 · Kurio')
    await expect(page.getByRole('radio', { name: '1/50' })).toHaveAttribute('aria-checked', 'true')
  })

  test('NFT inexistente mostra 404 específica', async ({ page }) => {
    await page.goto('/nft/nao-existe-999')
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
  })

  test('quantidade respeita o limite por pedido da edição', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    const plus = page.getByRole('button', { name: 'Aumentar quantidade' })
    // Edição 1/50: máximo de 5 por pedido.
    for (let i = 0; i < 4; i++) await plus.click()
    await expect(
      page.getByRole('status').filter({ hasText: 'Limite de 5 por pedido' }),
    ).toBeVisible()
    await expect(plus).toBeDisabled()
    // Papel "status" (output): ignora o contador da outra versão (desktop/celular), que está oculto.
    await expect(page.getByRole('status', { name: 'Quantidade' })).toHaveText('5')
  })

  test('favoritar exige login', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    await page.getByRole('button', { name: 'Favoritar' }).click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fnft%2Femerald-ape-042/)
  })
})

test.describe('Recomendações', () => {
  /** Arte de cada card de uma seção (sem o sufixo de variação = personagem). */
  async function arts(page: Page, heading: string) {
    const section = page.getByRole('region', { name: heading })
    await expect(section.getByRole('article').first()).toBeVisible()
    return section
      .locator('article img')
      .evaluateAll((imgs) => imgs.map((img) => (img as HTMLImageElement).getAttribute('src') ?? ''))
  }

  test('"Mais desta coleção" não repete o mesmo personagem lado a lado', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    const srcs = await arts(page, 'Mais desta coleção')
    const characters = srcs.map((src) => src.replace(/-(face|outfit|lg)\.webp$/, '.webp'))
    expect(srcs.length).toBeGreaterThanOrEqual(5)
    for (let i = 1; i < characters.length; i++) expect(characters[i]).not.toBe(characters[i - 1])
    expect(new Set(srcs).size).toBeGreaterThanOrEqual(4)
  })

  test('"Colecionadores também viram" não mostra o que já está no carrinho', async ({ page }) => {
    await addToCart(page, 'emerald-ape-042')
    const section = page.getByRole('region', { name: 'Colecionadores também viram' })
    await expect(section.getByRole('article').first()).toBeVisible()
    await expect(section.getByRole('heading', { name: 'Emerald Ape #042' })).toHaveCount(0)
    const srcs = await arts(page, 'Colecionadores também viram')
    for (let i = 1; i < srcs.length; i++) expect(srcs[i]).not.toBe(srcs[i - 1])
  })
})

test.describe('Carrinho', () => {
  test('adiciona, altera quantidade, aplica cupom, remove e sobrevive ao F5', async ({ page }) => {
    await addToCart(page, 'emerald-ape-042', { quantity: 2 })
    const item = cartItem(page, 'Emerald Ape #042')
    await expect(item).toContainText('2.38 ETH')
    // Contador do carrinho no cabeçalho (no celular, a tela do carrinho não tem cabeçalho).
    if (!isMobile(page)) {
      await expect(page.getByRole('link', { name: 'Carrinho, 2 itens' })).toBeVisible()
    }

    await item.getByRole('button', { name: /Aumentar quantidade/ }).click()
    await expect(item).toContainText('3.57 ETH')

    // Cupom inválido e vencido
    const coupon = page.getByRole('textbox', { name: 'Código promocional' })
    await coupon.fill('NAOEXISTE')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Cupom inválido.' })).toBeVisible()
    await coupon.fill('EXPIRADO')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Este cupom expirou.' })).toBeVisible()

    // Cupom válido: 10% de 3.57 = 0.357; total = 3.57 - 0.357 + 0.016 = 3.229
    await coupon.fill('kurio10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    const summary = page.getByRole('region', { name: 'Resumo da carteira' })
    await expect(summary).toContainText('(-) 0.357 ETH')
    await expect(summary).toContainText('3.229 ETH')

    await page.reload()
    await expect(cartItem(page, 'Emerald Ape #042')).toContainText('3.57 ETH')
    await expect(summary).toContainText('KURIO10')

    await cartItem(page, 'Emerald Ape #042')
      .getByRole('button', { name: /Remover/ })
      .click()
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('itens do visitante continuam no carrinho após o login', async ({ page }) => {
    await addToCart(page, 'sage-nomad-009')
    await page.goto('/')
    await login(page, 'bruno@kurio.dev', 'Kurio@123')
    await page.goto('/carrinho')
    await expect(cartItem(page, 'Sage Nomad #009')).toBeVisible()
  })

  test('visitante é levado ao login ao finalizar e volta ao pagamento', async ({ page }) => {
    await addToCart(page, 'golden-beat-207')
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fpagamento/)
  })
})
