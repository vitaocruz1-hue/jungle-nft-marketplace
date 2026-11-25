import { expect, type Locator, type Page } from '@playwright/test'

/** No desktop os filtros ficam na lateral; abaixo de 1024px, numa gaveta. */
export async function openFilters(page: Page): Promise<Locator> {
  const width = page.viewportSize()?.width ?? 1440
  if (width >= 1024) return page.getByRole('complementary', { name: 'Filtros do catálogo' })
  await page.getByRole('button', { name: 'Filtros' }).click()
  return page.getByRole('dialog', { name: 'Filtros' })
}

export async function closeFilters(page: Page) {
  const width = page.viewportSize()?.width ?? 1440
  if (width >= 1024) return
  await page.getByRole('dialog', { name: 'Filtros' }).getByRole('button', { name: /^Ver / }).click()
}

export function results(page: Page) {
  return page.getByRole('list', { name: 'Resultados do catálogo' })
}

/** Espera a lista terminar de atualizar (sem dados "anteriores" na tela). */
export async function waitForResults(page: Page) {
  await expect(results(page)).toHaveAttribute('aria-busy', 'false')
}

export async function cardNames(page: Page) {
  await waitForResults(page)
  return results(page).locator('article h3').allTextContents()
}

export async function cardPrices(page: Page) {
  await waitForResults(page)
  const texts = await results(page).locator('article p > span:first-child').allTextContents()
  return texts.map((text) => Number(text.replace(/[^\d.]/g, '')))
}

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768

/** "Ordenar por": na barra do catálogo; no celular, dentro da gaveta de filtros. */
export async function sortCombobox(page: Page): Promise<Locator> {
  if (!isMobile(page)) return page.getByRole('combobox', { name: 'Ordenar por:' })
  const sheet = await openFilters(page)
  return sheet.getByRole('combobox', { name: 'Ordenar por:' })
}

export async function chooseSort(page: Page, label: string) {
  await (await sortCombobox(page)).click()
  await page.getByRole('option', { name: label }).click()
  await closeFilters(page)
}

/** Desktop: lupa do cabeçalho (diálogo). Celular: campo "Explorar coleções" no topo. */
export async function searchFor(page: Page, term: string) {
  if (isMobile(page)) {
    const input = page.getByRole('searchbox', { name: 'Explorar coleções' })
    await input.fill(term)
    await input.press('Enter')
    return
  }
  await page.getByRole('button', { name: 'Buscar NFTs' }).click()
  const dialog = page.getByRole('dialog', { name: 'Buscar NFTs' })
  await expect(dialog.getByRole('searchbox', { name: 'Termo de busca' })).toBeFocused()
  await dialog.getByRole('searchbox', { name: 'Termo de busca' }).fill(term)
  await dialog.getByRole('button', { name: 'Buscar' }).click()
}
