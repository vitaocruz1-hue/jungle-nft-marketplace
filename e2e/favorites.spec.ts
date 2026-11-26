import { expect, test, type Page } from '@playwright/test'

import { isMobile, login, logout, USERS } from './support/auth'
import { useScenario } from './support/mocks'

const favoritesList = (page: Page) => page.getByRole('list', { name: 'Seus favoritos' })

/** Celular: coração da barra de abas. Desktop: "Favoritos" no menu do usuário. */
async function openFavorites(page: Page) {
  if (isMobile(page)) {
    await page
      .getByRole('navigation', { name: 'Navegação inferior' })
      .getByRole('link', { name: 'Favoritos' })
      .click()
  } else {
    await page
      .getByRole('banner')
      .getByRole('button', { name: /Conta de/ })
      .click()
    await page.getByRole('menuitem', { name: 'Favoritos' }).click()
  }
  await expect(page).toHaveURL(/\/favoritos$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Favoritos' })).toBeVisible()
}

/** Entra pela tela de login para a qual a rota privada redirecionou. */
async function loginFromRedirect(page: Page, user: (typeof USERS)[keyof typeof USERS]) {
  await expect(page).toHaveURL(/\/login\?redirect=%2Ffavoritos/)
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(user.email)
  await page.getByLabel('Senha', { exact: true }).fill(user.password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/favoritos$/)
}

test.describe('Favoritos', () => {
  test('visitante é levado ao login e volta para os favoritos', async ({ page }) => {
    await page.goto('/favoritos')
    await loginFromRedirect(page, USERS.ana)
    await expect(favoritesList(page).getByRole('article')).toHaveCount(1)
  })

  test('lista os cards, desfavoritar remove o card e mostra o estado vazio', async ({ page }) => {
    await page.goto('/')
    await login(page, USERS.ana.email, USERS.ana.password)
    await openFavorites(page)

    const card = favoritesList(page).getByRole('article').filter({ hasText: 'Sage Nomad #009' })
    await expect(card).toBeVisible()
    await expect(page.getByText('1 NFT favoritado')).toBeVisible()

    await card.getByRole('button', { name: 'Remover Sage Nomad #009 dos favoritos' }).click()
    await expect(card).toHaveCount(0)
    await expect(page.getByText('Você ainda não favoritou nenhum NFT')).toBeVisible()
    // O botão focado sumiu com o card: o foco vai para o título da página.
    await expect(page.getByRole('heading', { level: 1, name: 'Favoritos' })).toBeFocused()
    // Espera a API confirmar antes do F5 (o "servidor" simulado roda dentro da aba).
    await expect(page.getByText('Removido dos favoritos')).toBeVisible()

    // A remoção foi salva na API: continua vazio depois do F5.
    await page.reload()
    await expect(page.getByText('Você ainda não favoritou nenhum NFT')).toBeVisible()
    await page.getByRole('link', { name: 'Explorar NFTs' }).click()
    await expect(page).toHaveURL(/\/#catalogo$/)
  })

  test('favoritos de um usuário não aparecem para outro', async ({ page }) => {
    await page.goto('/')
    await login(page, USERS.bruno.email, USERS.bruno.password)
    await openFavorites(page)
    await expect(page.getByText('Você ainda não favoritou nenhum NFT')).toBeVisible()

    await page.goto('/nft/emerald-ape-042')
    await page.getByRole('button', { name: 'Favoritar' }).click()
    await expect(page.getByRole('button', { name: 'Favoritado' })).toBeVisible()
    await expect(page.getByText('Adicionado aos favoritos')).toBeVisible()
    await page.goto('/favoritos')
    await expect(favoritesList(page).getByRole('article')).toHaveText([/Emerald Ape #042/])

    await logout(page)
    await expect(page.getByText('Você saiu da sua conta.')).toBeVisible()
    await login(page, USERS.ana.email, USERS.ana.password)
    await openFavorites(page)
    await expect(favoritesList(page).getByRole('article')).toHaveText([/Sage Nomad #009/])
  })

  test('mostra skeleton enquanto carrega', async ({ page }) => {
    await useScenario(page, 'lento')
    await page.goto('/favoritos')
    await loginFromRedirect(page, USERS.ana)
    await expect(page.getByLabel('Carregando favoritos')).toBeVisible()
    await expect(favoritesList(page)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByLabel('Carregando favoritos')).toBeHidden()
  })

  test('erro ao carregar mostra "Tentar novamente" e se recupera', async ({ page }) => {
    await useScenario(page, 'erro-servidor')
    await page.goto('/favoritos')
    await loginFromRedirect(page, USERS.ana)
    await expect(
      page.getByRole('alert').filter({ hasText: 'Não foi possível carregar seus favoritos' }),
    ).toBeVisible({ timeout: 15_000 })

    await page.evaluate(() => sessionStorage.setItem('kurio:mock-scenario', 'padrao'))
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(favoritesList(page).getByRole('article')).toHaveText([/Sage Nomad #009/])
  })
})
