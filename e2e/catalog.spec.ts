import { expect, test } from '@playwright/test'

import {
  cardNames,
  cardPrices,
  chooseSort,
  closeFilters,
  openFilters,
  results,
  searchFor,
  sortCombobox,
  waitForResults,
} from './support/catalog'

test.describe('Catálogo da Início', () => {
  test('primeira página reproduz o Figma', async ({ page }) => {
    await page.goto('/')
    expect(await cardNames(page)).toEqual([
      'Emerald Ape #042',
      'Sage Nomad #009',
      'Neon Vessel #552',
      'Cosmic Bloom #118',
      'Violet Nomad #314',
      'Ivory Baron #088',
      'Golden Beat #207',
      'Golden Frequency #071',
      'Golden Signal #160',
    ])
  })

  test('filtros combinados, ordenação e paginação ficam na URL e sobrevivem ao histórico e ao F5', async ({
    page,
  }) => {
    await page.goto('/')
    await waitForResults(page)

    // Paginação
    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/[?&]page=2/)
    await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    const page2 = await cardNames(page)
    expect(page2).not.toContain('Emerald Ape #042')

    // Filtro novo volta para a página 1
    const filters = await openFilters(page)
    await filters.getByRole('link', { name: /^Música/ }).click()
    await expect(page).toHaveURL(/category=music/)
    await expect(page).not.toHaveURL(/page=/)

    // Filtros combinados (coleção + rede)
    await filters.getByRole('link', { name: /^Ethereum/ }).click()
    await expect(page).toHaveURL(/category=music/)
    await expect(page).toHaveURL(/network=ethereum/)
    await closeFilters(page)
    expect(await cardNames(page)).toContain('Golden Signal #160')
    expect(await cardNames(page)).not.toContain('Golden Beat #207') // Música, mas Polygon

    // Ordenação (no celular, fica dentro da gaveta de filtros)
    await chooseSort(page, 'Maior preço')
    await expect(page).toHaveURL(/sort=price-desc/)
    const prices = await cardPrices(page)
    expect(prices).toEqual([...prices].sort((a, b) => b - a))

    // F5 mantém tudo
    await page.reload()
    await expect(await sortCombobox(page)).toHaveText(/Maior preço/)
    await closeFilters(page)
    expect(await cardPrices(page)).toEqual(prices)

    // Voltar no histórico restaura cada estado anterior
    await page.goBack()
    await expect(page).not.toHaveURL(/sort=/)
    await expect(page).toHaveURL(/network=ethereum/)
    await page.goBack()
    await expect(page).not.toHaveURL(/network=/)
    await expect(page).toHaveURL(/category=music/)
    await page.goBack()
    await expect(page).toHaveURL(/page=2/)
    expect(await cardNames(page)).toEqual(page2)
  })

  test('faixa de preço filtra os resultados', async ({ page }) => {
    await page.goto('/')
    const filters = await openFilters(page)
    const minThumb = filters.getByRole('slider', { name: 'Preço mínimo' })
    await minThumb.focus()
    // Cada PageUp move 10% da faixa.
    for (let i = 0; i < 2; i++) await minThumb.press('PageUp')
    await filters.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page).toHaveURL(/minPrice=/)
    await closeFilters(page)

    const minPrice = Number(new URL(page.url()).searchParams.get('minPrice'))
    const prices = await cardPrices(page)
    expect(prices.length).toBeGreaterThan(0)
    for (const price of prices) expect(price).toBeGreaterThanOrEqual(minPrice)
  })

  test('busca combina com os filtros e pode ser limpa', async ({ page }) => {
    await page.goto('/?category=music')
    await waitForResults(page)

    await searchFor(page, 'signal')

    await expect(page).toHaveURL(/search=signal/)
    await expect(page).toHaveURL(/category=music/)
    const names = await cardNames(page)
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) expect(name.toLowerCase()).toContain('signal')

    await page.getByRole('link', { name: 'Limpar busca' }).click()
    await expect(page).not.toHaveURL(/search=/)
  })

  test('resultado vazio oferece limpar os filtros', async ({ page }) => {
    await page.goto('/?search=nada-por-aqui')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    await page.getByRole('link', { name: 'Limpar filtros' }).last().click()
    await expect(page).toHaveURL(/\/(#catalogo)?$/)
    expect(await cardNames(page)).toHaveLength(9)
  })

  test('parâmetros inválidos na URL não quebram a página', async ({ page }) => {
    await page.goto('/?page=abc&sort=xpto&category=inexistente')
    expect(await cardNames(page)).toHaveLength(9)
  })

  test('mostra skeletons durante carregamento lento', async ({ page }) => {
    await page.goto('/?cenario=lento')
    await expect(page.getByLabel('Carregando NFTs')).toBeVisible()
    await expect(results(page)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByLabel('Carregando NFTs')).toBeHidden()
  })
})
