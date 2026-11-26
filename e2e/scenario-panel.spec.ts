import { expect, test, type Page } from '@playwright/test'

import { results } from './support/catalog'
import { mocks } from './support/mocks'

test.describe('Painel de cenários: tempo real', () => {
  test('escolhe o NFT pelo nome, valida o preço e avisa o resultado', async ({ page }) => {
    // Em navegador automatizado o painel só aparece com ?painel=1.
    await page.goto('/?painel=1')
    await expect(results(page)).toContainText('Emerald Ape #042')
    await expect.poll(() => mocks(page, (m) => m.connectedClients())).toBe(1)

    await page.getByRole('button', { name: /Abrir painel de cenários/ }).click()
    const panel = page.getByRole('region', { name: 'Cenários da simulação' })
    const nft = panel.getByLabel('NFT', { exact: true })
    const price = panel.getByLabel('Novo preço')
    const change = panel.getByRole('button', { name: 'Alterar preço (nft.updated)' })

    // Lista pelo nome (o valor é o id interno).
    await nft.selectOption({ label: 'Emerald Ape #042' })
    await expect(nft).toHaveValue('emerald-ape-042')
    await expect(panel.getByText('Preço atual: 1.19 ETH')).toBeVisible()

    // Valores inválidos: mensagem clara e botão desabilitado.
    const invalid: Array<[string, string]> = [
      ['', 'Informe o novo preço.'],
      ['abc', 'Use só números, com vírgula ou ponto (ex.: 4,00).'],
      ['0', 'O preço precisa ser maior que zero.'],
      ['1.1234567890123456789', 'Use no máximo 18 casas decimais.'],
    ]
    for (const [value, message] of invalid) {
      await price.fill(value)
      await expect(panel.getByText(message)).toBeVisible()
      await expect(price).toHaveAttribute('aria-invalid', 'true')
      await expect(change).toBeDisabled()
    }

    // Vírgula vale como separador; o valor vai como string decimal com ponto.
    await price.fill('4,00')
    await expect(change).toBeEnabled()
    await change.click()
    await expect(panel.getByRole('status')).toHaveText(
      'Preço do Emerald Ape #042 alterado para 4.00 ETH.',
    )
    await expect(panel.getByText('Preço atual: 4.00 ETH')).toBeVisible()
    await expect(results(page).locator('article', { hasText: 'Emerald Ape #042' })).toContainText(
      '4.00 ETH',
    )
  })
})

type Box = { x: number; y: number; width: number; height: number }

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

const scenariosButton = (page: Page) =>
  page.getByRole('button', { name: /Abrir painel de cenários/ })

/** Caixas do botão "Cenários", da barra fixa do rodapé e de cada item dela. */
async function layout(page: Page) {
  return page.evaluate(() => {
    const box = (el: Element) => {
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height }
    }
    const fab = document.querySelector('#painel-cenarios button')
    const bar = [...document.querySelectorAll('[data-bottom-bar]')].find(
      (el) => el.getBoundingClientRect().height > 0,
    )
    // Itens clicáveis da barra (inclui o botão central de busca, que sobe acima dela).
    const items = bar ? [...bar.querySelectorAll('a, button')].map(box) : []
    const barTop = bar ? Math.min(box(bar).y, ...items.map((item) => item.y)) : null
    return { fab: fab ? box(fab) : null, barTop, items }
  })
}

test.describe('Painel de cenários: posição', () => {
  for (const [label, path] of [
    ['barra de abas (Início)', '/'],
    ['barra de compra (Detalhe)', '/nft/emerald-ape-042'],
  ] as const) {
    test(`em 390 px o botão "Cenários" fica acima da ${label}, sem cobrir nenhum item`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(`${path}?painel=1`)
      await expect(scenariosButton(page)).toBeVisible()

      await expect
        .poll(async () => {
          const { fab, barTop, items } = await layout(page)
          if (!fab || barTop === null || items.length === 0) return 'sem botão ou sem barra'
          const covered = items.filter((item) => overlaps(fab, item)).length
          const above = fab.y + fab.height <= barTop
          return covered === 0 && above ? 'ok' : `cobre ${covered} item(ns), acima=${above}`
        })
        .toBe('ok')
    })
  }

  test('no desktop o botão "Cenários" continua no canto inferior esquerdo', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Confere só a largura de desktop.')
    await page.goto('/?painel=1')
    const box = await scenariosButton(page).boundingBox()
    expect(box).not.toBeNull()
    expect(Math.round(box!.x)).toBe(12)
    expect(Math.round(900 - (box!.y + box!.height))).toBe(12)
  })
})
