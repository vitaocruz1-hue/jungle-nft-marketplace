import { expect, test, type Page } from '@playwright/test'

import { results } from './support/catalog'
import { useScenario } from './support/mocks'

/**
 * O app nunca pode receber HTML como dado nem mostrar a tela genérica do
 * roteador ("Something went wrong"). Cobre as camadas da correção:
 * MSW fora de controle (recarregamento forçado), resposta que não é JSON e
 * resposta JSON fora do contrato (zod), e a página de erro do site.
 */

const SPA_HTML =
  '<!doctype html><html lang="pt-BR"><head><title>Kurio</title></head><body><div id="root"></div></body></html>'

/** Liga/desliga o "Bypass for network" do DevTools (o service worker é ignorado). */
async function bypassServiceWorker(page: Page, bypass: boolean) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setBypassServiceWorker', { bypass })
  return cdp
}

async function expectNoGenericCrash(page: Page) {
  await expect(page.getByText('Something went wrong')).toHaveCount(0)
}

test.describe('Resiliência: API simulada fora do ar ou respostas inválidas', () => {
  test('recarregar ignorando o service worker (e com HTML em /api) mostra aviso claro e se recupera', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(results(page)).toContainText('Emerald Ape #042')

    // Como a hospedagem responderia /api com o rewrite da SPA: index.html, status 200.
    let apiCallsToHost = 0
    await page.route('**/api/**', (route) => {
      apiCallsToHost += 1
      return route.fulfill({ status: 200, contentType: 'text/html', body: SPA_HTML })
    })
    const cdp = await bypassServiceWorker(page, true)

    // O app recarrega sozinho uma vez; sem controle, desiste e avisa.
    await page.reload()
    const notice = page.getByRole('alert').filter({
      hasText: 'Isso acontece depois de um recarregamento forçado',
    })
    await expect(notice).toBeVisible()
    await expect(page.getByRole('button', { name: 'Recarregar página' }).first()).toBeVisible()
    await expectNoGenericCrash(page)
    // Só a prova de vida do MSW foi para a "hospedagem": nenhuma chamada da API real.
    expect(apiCallsToHost).toBeLessThanOrEqual(2)

    // O DevTools volta ao normal: recarregar devolve o site funcionando.
    await cdp.send('Network.setBypassServiceWorker', { bypass: false })
    await page.unroute('**/api/**')
    await notice.getByRole('button', { name: 'Recarregar página' }).click()
    await expect(results(page)).toContainText('Emerald Ape #042')
    await expect(notice).toHaveCount(0)
    await expectNoGenericCrash(page)
  })

  test('API respondendo HTML (status 200) vira erro tratado no catálogo e no carrinho', async ({
    page,
  }) => {
    await useScenario(page, 'api-html')
    await page.goto('/')
    const catalogError = page
      .getByRole('alert')
      .filter({ hasText: 'Não foi possível falar com a API' })
    await expect(catalogError.first()).toBeVisible({ timeout: 20_000 })
    await expectNoGenericCrash(page)

    await page.goto('/carrinho')
    await expect(
      page.getByRole('alert').filter({ hasText: 'Não foi possível falar com a API' }).first(),
    ).toBeVisible({ timeout: 20_000 })
    await expectNoGenericCrash(page)
  })

  test('JSON fora do contrato: catálogo mostra erro e o detalhe mostra a página de erro do site', async ({
    page,
  }) => {
    await useScenario(page, 'formato-invalido')
    await page.goto('/')
    await expect(
      page.getByRole('alert').filter({ hasText: 'formato inesperado' }).first(),
    ).toBeVisible()
    await expectNoGenericCrash(page)

    await page.goto('/nft/emerald-ape-042')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Não foi possível carregar este NFT' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Restaurar dados de demonstração' }),
    ).toBeVisible()
    await expectNoGenericCrash(page)

    // A API volta ao normal: "Tentar novamente" carrega o NFT sem recarregar a página.
    await page.evaluate(() => sessionStorage.setItem('kurio:mock-scenario', 'padrao'))
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  })

  test('"Restaurar dados de demonstração" volta ao cenário inicial e recarrega', async ({
    page,
  }) => {
    await page.goto('/nft/emerald-ape-042?cenario=formato-invalido')
    await page.getByRole('button', { name: 'Restaurar dados de demonstração' }).click()
    await expect(page).toHaveURL('/nft/emerald-ape-042')
    // O cenário de rede volta ao padrão: o NFT carrega.
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expectNoGenericCrash(page)
  })
})
