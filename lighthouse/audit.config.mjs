/**
 * Configuração versionada da auditoria Lighthouse (ver lighthouse/run.mjs).
 * Build de produção + mocks no cenário padrão, como exige o desafio.
 */
export default {
  port: 4190,
  runsPerPage: 3,
  pages: [
    { id: 'inicio', path: '/' },
    { id: 'detalhe', path: '/nft/emerald-ape-042' },
  ],
  /** mobile = configuração padrão do Lighthouse; desktop = preset oficial de desktop. */
  profiles: ['mobile', 'desktop'],
  categories: ['performance', 'accessibility', 'best-practices', 'seo'],
  targets: { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 },
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
}
