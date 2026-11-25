import { defineConfig, devices } from '@playwright/test'

// Porta exclusiva dos testes, para não colidir com um `npm run preview` aberto.
const PORT = 4180
const isCI = !!process.env.CI

const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
const mobile = { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } }

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // Fluxos (desktop/mobile) e regressão visual (@visual) ficam em projetos
  // separados: screenshots dependem do sistema operacional (fontes), então as
  // baselines têm sufixo de plataforma e rodam com `npm run test:visual`.
  projects: [
    {
      name: 'desktop',
      grepInvert: /@visual/,
      use: { ...desktop },
    },
    {
      name: 'mobile',
      grepInvert: /@visual/,
      use: { ...mobile },
    },
    {
      name: 'visual-desktop',
      grep: /@visual/,
      use: { ...desktop },
    },
    {
      name: 'visual-mobile',
      grep: /@visual/,
      use: { ...mobile },
    },
  ],

  // Testa o build de produção (igual ao que vai para o deploy), com os mocks ligados.
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
