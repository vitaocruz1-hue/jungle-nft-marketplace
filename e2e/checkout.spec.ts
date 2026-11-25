import { expect, test, type Page } from '@playwright/test'

import { login } from './support/auth'
import { mocks, useScenario } from './support/mocks'

async function addToCart(page: Page, nftId: string) {
  await page.goto(`/nft/${nftId}`)
  await page.getByRole('button', { name: 'Comprar', exact: true }).click()
  await expect(page).toHaveURL('/carrinho')
}

/** Ana (com carteira cadastrada) adiciona um NFT e chega à revisão do pedido. */
async function reachReview(page: Page, nftId = 'emerald-ape-042') {
  await page.goto('/')
  await login(page, 'ana@kurio.dev', 'Kurio@123')
  await addToCart(page, nftId)
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL('/pagamento')
  await page.getByRole('button', { name: 'Revisar pedido' }).click()
  await expect(page.getByRole('heading', { name: 'Revise seu pedido' })).toBeFocused()
}

test.describe('Pagamento e confirmação', () => {
  test('compra completa: do catálogo ao recibo confirmado', async ({ page }) => {
    await page.goto('/')
    await login(page, 'ana@kurio.dev', 'Kurio@123')
    await page
      .getByRole('link', { name: /Emerald Ape #042/ })
      .first()
      .click()
    await page.getByRole('button', { name: 'Comprar', exact: true }).click()
    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()

    // Validação: campo obrigatório vazio impede a revisão.
    await page.getByRole('textbox', { name: 'Nome do perfil' }).fill('')
    await page.getByRole('button', { name: 'Revisar pedido' }).click()
    await expect(page.getByText('Informe o nome do perfil.')).toBeVisible()
    await page.getByRole('textbox', { name: 'Nome do perfil' }).fill('ana.colecionadora')

    await page.getByRole('button', { name: 'Revisar pedido' }).click()
    await expect(page.getByRole('heading', { name: 'Revise seu pedido' })).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(page).toHaveURL(/\/pedido\/ord-/)
    await expect(page.getByRole('heading', { name: 'Processando seu pagamento' })).toBeVisible()
    // A confirmação chega pelo Socket.IO (order.updated).
    await expect(
      page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByRole('cell', { name: /Emerald Ape #042/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Ver no Etherscan/ })).toBeVisible()

    // Só o item comprado sai do carrinho.
    await page.goto('/carrinho')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('pagamento recusado mantém os itens no carrinho', async ({ page }) => {
    await useScenario(page, 'pagamento-recusado')
    await reachReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({
      timeout: 10_000,
    })
    await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' })).toBeVisible()
  })

  test('clique repetido não cria pedido duplicado', async ({ page }) => {
    await reachReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).dblclick()
    await expect(page).toHaveURL(/\/pedido\/ord-/)
    expect(await mocks(page, (m) => m.ordersCount())).toBe(1)
  })

  test('timeout após criar o pedido recupera o MESMO pedido', async ({ page }) => {
    test.setTimeout(60_000)
    await useScenario(page, 'timeout-pedido')
    await reachReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    // A 1ª resposta se perde (timeout de 10s); a nova tentativa usa a mesma chave.
    await expect(page).toHaveURL(/\/pedido\/ord-/, { timeout: 25_000 })
    expect(await mocks(page, (m) => m.ordersCount())).toBe(1)
  })

  test('carteira recusada: mostra o erro e permite tentar de novo', async ({ page }) => {
    await useScenario(page, 'carteira-recusa')
    await reachReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'A conexão foi recusada na carteira.' }),
    ).toBeVisible()
    await expect(page).toHaveURL('/pagamento')
    expect(await mocks(page, (m) => m.ordersCount())).toBe(0)
  })

  test('preço alterado via Socket.IO durante a revisão exige nova confirmação', async ({
    page,
  }) => {
    await reachReview(page)
    await mocks(page, (m) => m.changeNftPrice('emerald-ape-042', '2.00'))

    await expect(page.getByRole('alert').filter({ hasText: 'mudou' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled()

    await page.getByRole('button', { name: 'Atualizar cotação' }).click()
    await expect(page.getByRole('complementary').getByText('2.00 ETH').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
  })

  test('pedido pendente sobrevive ao F5 e é confirmado sem nova compra', async ({ page }) => {
    await reachReview(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByRole('heading', { name: 'Processando seu pagamento' })).toBeVisible()
    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible({
      timeout: 10_000,
    })
    expect(await mocks(page, (m) => m.ordersCount())).toBe(1)
  })
})

test.describe('Tempo real', () => {
  test('preço muda no catálogo e no carrinho; duplicados e eventos antigos são ignorados', async ({
    page,
  }) => {
    await addToCart(page, 'emerald-ape-042')
    await mocks(page, (m) => m.changeNftPrice('emerald-ape-042', '1.50'))

    // Carrinho aberto: aviso + resumo atualizado.
    await expect(page.getByText('Preço atualizado: de 1.19 ETH para 1.50 ETH.')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Resumo da carteira' })).toContainText(
      '1.516 ETH',
    )

    // Evento repetido e evento com versão antiga não mudam nada.
    await mocks(page, (m) => m.replayLastEvent())
    await mocks(page, (m) => m.emitStaleNftEvent('emerald-ape-042'))
    await page.getByRole('link', { name: 'Início', exact: true }).first().click()
    const card = page.locator('article', { hasText: 'Emerald Ape #042' })
    await expect(card).toContainText('1.50 ETH')
    await expect(card).not.toContainText('999')
  })

  test('após desconexão, reconecta e reconcilia com a API', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('article', { hasText: 'Emerald Ape #042' })).toContainText('1.19 ETH')
    await mocks(page, (m) => m.dropConnections())
    // Mudança enquanto desconectado: chega pela reconciliação REST ao reconectar.
    await mocks(page, (m) => m.changeNftPrice('emerald-ape-042', '3.33'))
    await expect(page.locator('article', { hasText: 'Emerald Ape #042' })).toContainText(
      '3.33 ETH',
      {
        timeout: 10_000,
      },
    )
  })
})
