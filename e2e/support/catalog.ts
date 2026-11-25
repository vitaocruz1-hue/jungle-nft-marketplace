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
