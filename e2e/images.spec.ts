import { expect, test, type Page } from '@playwright/test'

/**
 * Imagens com dimensões explícitas: o navegador reserva o espaço antes de
 * carregar (sem "pulos" na página). Confere a aba Problemas do DevTools
 * (aviso "Lazy-loaded images should have explicit dimensions", via CDP) e que
 * width/height declarados são as dimensões reais de cada arquivo.
 */

/** Rola a página até o fim, aos poucos, para as imagens "lazy" carregarem. */
async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y <= height; y += 600) {
    await page.evaluate((top) => window.scrollTo(0, top), y)
    await page.waitForTimeout(100)
  }
}

/**
 * Imagens sem width/height, ou com valores diferentes do arquivo real. O tamanho
 * real vem de uma cópia carregada à parte: imagens "lazy" escondidas ou fora da
 * tela (ex.: carrosséis) nunca carregam na página.
 */
async function wrongImages(page: Page) {
  return page.evaluate(async () => {
    const realSize = (src: string) =>
      new Promise<[number, number]>((resolve) => {
        const probe = new Image()
        probe.onload = () => resolve([probe.naturalWidth, probe.naturalHeight])
        probe.onerror = () => resolve([0, 0])
        probe.src = src
      })
    const problems: string[] = []
    for (const img of document.querySelectorAll('img')) {
      const width = Number(img.getAttribute('width'))
      const height = Number(img.getAttribute('height'))
      const name = img.src.split('/').pop() ?? img.src
      if (!width || !height) {
        problems.push(`${name}: sem width/height`)
        continue
      }
      const [realWidth, realHeight] = await realSize(img.src)
      if (width !== realWidth || height !== realHeight) {
        problems.push(`${name}: declara ${width}x${height}, arquivo ${realWidth}x${realHeight}`)
      }
    }
    return problems
  })
}

const PAGES = [
  { name: 'Início', open: (page: Page) => page.goto('/') },
  { name: 'Detalhe', open: (page: Page) => page.goto('/nft/emerald-ape-042') },
  {
    name: 'Carrinho',
    open: async (page: Page) => {
      await page.goto('/nft/emerald-ape-042')
      await page.getByRole('button', { name: /^Comprar( NFT)?$/ }).click()
      await expect(page).toHaveURL('/carrinho')
      await page.reload()
    },
  },
]

test.describe('Imagens com dimensões explícitas', () => {
  for (const { name, open } of PAGES) {
    test(`${name}: sem aviso de imagem lazy e com width/height reais`, async ({ page }) => {
      const cdp = await page.context().newCDPSession(page)
      const lazyIssues: string[] = []
      cdp.on('Audits.issueAdded', ({ issue }) => {
        if (issue.code === 'LazyLoadImageIssue') {
          lazyIssues.push(issue.details.lazyLoadImageIssueDetails?.url ?? '?')
        }
      })
      await cdp.send('Audits.enable')

      await open(page)
      await expect(page.locator('main img').filter({ visible: true }).first()).toBeVisible()
      await page.waitForLoadState('networkidle')
      await scrollThrough(page)

      await expect.poll(() => wrongImages(page), { timeout: 15_000 }).toEqual([])
      expect(lazyIssues).toEqual([])
    })
  }
})
