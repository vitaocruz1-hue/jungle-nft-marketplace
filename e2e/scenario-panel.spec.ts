import { expect, test } from '@playwright/test'

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
