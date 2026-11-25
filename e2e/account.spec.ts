import { expect, test } from '@playwright/test'

import { expectLoggedIn, login } from './support/auth'
import { mocks, useScenario } from './support/mocks'

async function logout(page: import('@playwright/test').Page) {
  const width = page.viewportSize()?.width ?? 1440
  if (width < 640) {
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await page
      .getByRole('dialog', { name: 'Menu' })
      .getByRole('button', { name: /Conta de/ })
      .click()
  } else {
    await page
      .getByRole('banner')
      .getByRole('button', { name: /Conta de/ })
      .click()
  }
  await page.getByRole('menuitem', { name: 'Sair' }).click()
}

test.describe('Sessão', () => {
  test('sessão expirada leva ao login e volta para a mesma página', async ({ page }) => {
    await page.goto('/')
    await login(page, 'ana@kurio.dev', 'Kurio@123')
    await page.goto('/carteiras')
    await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()

    await mocks(page, (m) => m.expireSession())
    await page.reload()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fcarteiras/)

    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('ana@kurio.dev')
    await page.getByLabel('Senha', { exact: true }).fill('Kurio@123')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL('/carteiras')
  })

  test('expiração durante a navegação avisa e preserva o contexto', async ({ page }) => {
    await page.goto('/')
    await login(page, 'ana@kurio.dev', 'Kurio@123')
    await page.goto('/nft/sage-nomad-009')
    await expect(page.getByRole('button', { name: 'Favoritado' })).toBeVisible()
    await mocks(page, (m) => m.expireSession())
    await page.getByRole('button', { name: 'Favoritado' }).click()
    await expect(page.getByText('Sua sessão expirou', { exact: true })).toBeVisible()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fnft%2Fsage-nomad-009&motivo=expirada/)
  })

  test('logout e troca de usuário não vazam dados privados', async ({ page }) => {
    await page.goto('/')
    await login(page, 'ana@kurio.dev', 'Kurio@123')
    await page.goto('/carteiras')
    await expect(page.getByText('Cofre principal')).toBeVisible()

    await logout(page)
    await expect(page.getByText('Você saiu da sua conta.')).toBeVisible()

    await login(page, 'bruno@kurio.dev', 'Kurio@123')
    await expectLoggedIn(page, 'bruno.nft')
    await page.goto('/carteiras')
    await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
    await expect(page.getByText('Cofre principal')).toHaveCount(0)

    // Favoritos são por usuário: o de Ana não aparece para Bruno.
    await page.goto('/nft/sage-nomad-009')
    await expect(page.getByRole('button', { name: 'Favoritar' })).toBeVisible()
  })
})

test.describe('Favoritos', () => {
  test('falha ao favoritar desfaz a mudança otimista e permite tentar de novo', async ({
    page,
  }) => {
    await useScenario(page, 'falha-favoritos')
    await page.goto('/')
    await login(page, 'bruno@kurio.dev', 'Kurio@123')
    await page.goto('/nft/emerald-ape-042')

    const button = page.getByRole('button', { name: 'Favoritar' })
    await button.click()
    await expect(page.getByText('Não foi possível atualizar seus favoritos')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Favoritar' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    // Volta a funcionar: o favorito persiste após F5.
    await page.evaluate(() => sessionStorage.setItem('kurio:mock-scenario', 'padrao'))
    await page.getByRole('button', { name: 'Favoritar' }).click()
    // Espera a confirmação da API (o botão muda antes, de forma otimista).
    await expect(page.getByText('Adicionado aos favoritos')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Favoritado' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})

test.describe('Perfil e carteiras', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await login(page, 'bruno@kurio.dev', 'Kurio@123')
  })

  test('edita perfil com validação e conflito, e os dados persistem', async ({ page }) => {
    await page.goto('/perfil')
    const email = page.getByRole('textbox', { name: 'E-mail', exact: true })
    await email.fill('email-invalido')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
    await expect(email).toBeFocused()

    await email.fill('ana@kurio.dev')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('Este e-mail já está em uso.')).toBeVisible()

    await email.fill('bruno.novo@kurio.dev')
    await page.getByRole('textbox', { name: 'Nome de exibição' }).fill('Bruno L.')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('Perfil atualizado.')).toBeVisible()
    await page.reload()
    await expect(page.getByRole('textbox', { name: 'Nome de exibição' })).toHaveValue('Bruno L.')
  })

  test('troca o avatar e valida o arquivo', async ({ page }) => {
    await page.goto('/perfil')
    const input = page.locator('#perfil-avatar')
    await input.setInputFiles({
      name: 'nota.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('oi'),
    })
    await expect(page.getByText('Escolha um arquivo de imagem.')).toBeVisible()

    // PNG 1x1 válido
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    )
    await input.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png })
    await expect(page.getByRole('img', { name: 'Avatar de Bruno Lima' })).toBeVisible()
  })

  test('altera a senha com validação da senha atual', async ({ page }) => {
    await page.goto('/perfil')
    await page.getByLabel('Senha atual').fill('errada123')
    await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha1')
    await page.getByLabel('Confirmar nova senha').fill('NovaSenha1')
    await page.getByRole('button', { name: 'Salvar nova senha' }).click()
    await expect(page.getByText('Senha atual incorreta.')).toBeVisible()

    await page.getByLabel('Senha atual').fill('Kurio@123')
    await page.getByRole('button', { name: 'Salvar nova senha' }).click()
    await expect(page.getByText('Senha alterada.')).toBeVisible()
  })

  test('cadastra carteira principal com erros de validação', async ({ page }) => {
    await page.goto('/carteiras')
    await page.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Use um endereço 0x com 40 caracteres hexadecimais.')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Nome de exibição' })).toBeFocused()

    await page.getByRole('textbox', { name: 'Nome de exibição' }).fill('Bruno Lima')
    await page.getByRole('textbox', { name: 'Apelido da carteira' }).fill('Carteira de música')
    await page.getByRole('combobox', { name: 'Rede' }).click()
    await page.getByRole('option', { name: 'Polygon' }).click()
    await page.getByRole('textbox', { name: 'Nome do perfil' }).fill('bruno.nft')
    await page
      .getByRole('textbox', { name: 'Endereço da carteira' })
      .fill('0x1234567890abcdef1234567890abcdef12345678')
    await page.getByRole('combobox', { name: 'Tipo de carteira' }).click()
    await page.getByRole('option', { name: 'Coinbase Wallet' }).click()
    await page.getByRole('textbox', { name: 'Código de indicação' }).fill('musica2026')
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('bruno@kurio.dev')
    await page.getByRole('textbox', { name: 'Nome ENS' }).fill('brunolima')
    await page.getByRole('button', { name: 'Salvar carteira' }).click()

    await expect(page.getByText('Carteira principal salva.')).toBeVisible()
    await page.reload()
    await expect(page.getByText(/Carteira de música · Coinbase Wallet/)).toBeVisible()
  })
})

test.describe('Acessibilidade e recuperação de falhas', () => {
  test('navegação por teclado: pular para o conteúdo e foco no diálogo de busca', async ({
    page,
  }) => {
    test.skip((page.viewportSize()?.width ?? 1440) < 640, 'teclado físico: cenário de desktop')
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#conteudo')).toBeFocused()

    await page.getByRole('button', { name: 'Buscar NFTs' }).focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Buscar NFTs' })
    await expect(dialog.getByRole('searchbox')).toBeFocused()
    // O foco fica preso dentro do diálogo.
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab')
    await expect(dialog.locator(':focus')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: 'Buscar NFTs' })).toBeFocused()
  })

  test('erro no catálogo mostra feedback e se recupera ao tentar de novo', async ({ page }) => {
    await useScenario(page, 'erro-servidor')
    await page.goto('/')
    await expect(
      page.getByRole('alert').filter({ hasText: 'Não foi possível carregar o catálogo' }),
    ).toBeVisible({
      timeout: 15_000,
    })
    await page.evaluate(() => sessionStorage.setItem('kurio:mock-scenario', 'padrao'))
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('list', { name: 'Resultados do catálogo' })).toBeVisible()
  })

  test('falhas passageiras são repetidas automaticamente', async ({ page }) => {
    await useScenario(page, 'instavel')
    await page.goto('/')
    await expect(page.getByRole('list', { name: 'Resultados do catálogo' })).toBeVisible({
      timeout: 15_000,
    })
  })
})
