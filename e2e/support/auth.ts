import { expect, type Page } from '@playwright/test'

export const USERS = {
  ana: { email: 'ana@kurio.dev', password: 'Kurio@123', username: 'ana.colecionadora' },
  bruno: { email: 'bruno@kurio.dev', password: 'Kurio@123', username: 'bruno.nft' },
} as const

/** Abaixo de 768 px o app usa o layout mobile do Figma (barra de abas inferior). */
export function isMobile(page: Page) {
  return (page.viewportSize()?.width ?? 1440) < 768
}

function tabBar(page: Page) {
  return page.getByRole('navigation', { name: 'Navegação inferior' })
}

/** Desktop: "Entrar" no cabeçalho. Celular: ícone de conta na barra de abas. */
async function openLogin(page: Page) {
  if (isMobile(page)) await tabBar(page).getByRole('link', { name: 'Entrar' }).click()
  else await page.getByRole('banner').getByRole('link', { name: 'Entrar' }).click()
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
  if (isMobile(page)) {
    await expect(tabBar(page).getByRole('link', { name: `Perfil de ${username}` })).toBeVisible()
  } else {
    await expect(page.getByRole('banner').getByText(username)).toBeVisible()
  }
}

/** Desktop: menu da conta no cabeçalho. Celular: "Sair" no menu "Meu perfil". */
export async function logout(page: Page) {
  if (isMobile(page)) {
    await page.goto('/perfil')
    await page
      .getByRole('navigation', { name: 'Meu perfil' })
      .getByRole('button', { name: 'Sair' })
      .click()
  } else {
    await page
      .getByRole('banner')
      .getByRole('button', { name: /Conta de/ })
      .click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
  }
}
