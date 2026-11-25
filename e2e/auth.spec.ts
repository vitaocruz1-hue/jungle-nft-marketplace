import { expect, test } from '@playwright/test'

import { login } from './support/auth'

test.describe('Conta e sessão', () => {
  test('login com credenciais válidas mostra o menu da conta', async ({ page }) => {
    await page.goto('/')
    await login(page, 'ana@kurio.dev', 'Kurio@123')
    await expect(page).toHaveURL('/')
  })

  test('login inválido mostra erro e mantém o usuário na tela', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('ana@kurio.dev')
    await page.getByLabel('Senha', { exact: true }).fill('errada123')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
    await expect(page).toHaveURL(/\/login/)
  })

  test('validação do cadastro e conflito de e-mail', async ({ page }) => {
    await page.goto('/cadastro')
    await page.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()
    await expect(page.getByRole('textbox', { name: 'Nome de usuário' })).toBeFocused()
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()

    await page.getByRole('textbox', { name: 'Nome de usuário' }).fill('novo.colecionador')
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('ana@kurio.dev')
    await page.getByLabel('Senha', { exact: true }).fill('Segura123')
    await page.getByLabel('Confirmar senha').fill('Segura123')
    await page.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click()

    const email = page.getByRole('textbox', { name: 'E-mail', exact: true })
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()
    await expect(email).toBeFocused()
  })

  test('rota privada redireciona ao login e volta após entrar', async ({ page }) => {
    await page.goto('/perfil')
    await expect(page).toHaveURL(/\/login\?redirect=%2Fperfil/)
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('bruno@kurio.dev')
    await page.getByLabel('Senha', { exact: true }).fill('Kurio@123')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL('/perfil')
  })
})
