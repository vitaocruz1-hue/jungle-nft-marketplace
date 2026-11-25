import { expect, type Page } from '@playwright/test'

export const USERS = {
  ana: { email: 'ana@kurio.dev', password: 'Kurio@123', username: 'ana.colecionadora' },
  bruno: { email: 'bruno@kurio.dev', password: 'Kurio@123', username: 'bruno.nft' },
} as const

/** Abre o menu (no celular) e clica em "Entrar". */
async function openLogin(page: Page) {
  const width = page.viewportSize()?.width ?? 1440
  if (width < 640) {
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'Entrar' }).click()
  } else {
    await page.getByRole('banner').getByRole('link', { name: 'Entrar' }).click()
  }
}

export async function login(page: Page, email: string, password: string) {
  await openLogin(page)
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/)
  const user = Object.values(USERS).find((u) => u.email === email)
  if (user) await expectLoggedIn(page, user.username)
}

export async function expectLoggedIn(page: Page, username: string) {
  const width = page.viewportSize()?.width ?? 1440
  if (width < 640) {
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await expect(page.getByRole('dialog', { name: 'Menu' }).getByText(username)).toBeVisible()
    await page.keyboard.press('Escape')
  } else {
    await expect(page.getByRole('banner').getByText(username)).toBeVisible()
  }
}
