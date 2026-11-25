/**
 * Auditoria Lighthouse: 3 execuções por página e perfil, mediana de cada
 * categoria, LCP/CLS/TBT e relatórios HTML/JSON em lighthouse/reports/.
 *
 * Uso: npm run audit   (faz o build e roda este script)
 */
import { spawn } from 'node:child_process'
import http from 'node:http'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from '@playwright/test'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

import config from './audit.config.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const reportsDir = path.join(here, 'reports')
const require = createRequire(import.meta.url)
const lighthouseVersion = require('lighthouse/package.json').version
const baseUrl = `http://127.0.0.1:${config.port}`

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

async function startPreview() {
  const root = path.join(here, '..')
  const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
  const server = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(config.port), '--strictPort'],
    { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  // A saída precisa ser consumida (com stdio 'ignore' o preview não sobe no Windows).
  let output = ''
  server.stdout.on('data', (chunk) => (output += chunk))
  server.stderr.on('data', (chunk) => (output += chunk))
  let lastError
  for (let i = 0; i < 60; i++) {
    try {
      // http nativo: algumas dependências trocam o fetch global (ex.: proxy).
      const status = await new Promise((resolve, reject) => {
        http
          .get(baseUrl, (response) => {
            response.resume()
            resolve(response.statusCode)
          })
          .on('error', reject)
      })
      if (status === 200) return server
    } catch (error) {
      lastError = error // ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  server.kill()
  throw new Error(`O servidor de preview não respondeu: ${lastError?.cause?.code ?? lastError}
${output}`)
}

async function audit(url, profile) {
  // Chrome novo a cada execução: perfil limpo (sem cache nem dados dos mocks).
  const chrome = await chromeLauncher.launch({
    chromePath: chromium.executablePath(),
    chromeFlags: config.chromeFlags,
  })
  try {
    const result = await lighthouse(
      url,
      {
        port: chrome.port,
        output: ['html', 'json'],
        logLevel: 'error',
        onlyCategories: config.categories,
      },
      profile === 'desktop' ? desktopConfig : undefined,
    )
    return result
  } finally {
    await chrome.kill()
  }
}

async function main() {
  await mkdir(reportsDir, { recursive: true })
  const server = await startPreview()
  const rows = []
  let environment = null

  try {
    for (const page of config.pages) {
      for (const profile of config.profiles) {
        const runs = []
        for (let run = 1; run <= config.runsPerPage; run++) {
          process.stdout.write(`${page.id} · ${profile} · execução ${run}… `)
          const result = await audit(`${baseUrl}${page.path}`, profile)
          const { lhr, report } = result
          environment ??= lhr.environment
          const scores = Object.fromEntries(
            config.categories.map((id) => [id, Math.round((lhr.categories[id]?.score ?? 0) * 100)]),
          )
          const metrics = {
            lcp: lhr.audits['largest-contentful-paint'].numericValue,
            cls: lhr.audits['cumulative-layout-shift'].numericValue,
            tbt: lhr.audits['total-blocking-time'].numericValue,
          }
          runs.push({ scores, metrics, report })
          console.log(config.categories.map((id) => `${id}=${scores[id]}`).join(' '))
        }

        const medians = Object.fromEntries(
          config.categories.map((id) => [id, median(runs.map((r) => r.scores[id]))]),
        )
        // Guarda os relatórios da execução de performance mediana.
        const representative =
          runs.find((r) => r.scores.performance === medians.performance) ?? runs[0]
        const [html, json] = representative.report
        const base = path.join(reportsDir, `${page.id}-${profile}`)
        await writeFile(`${base}.report.html`, html)
        await writeFile(`${base}.report.json`, json)

        rows.push({
          page: page.id,
          profile,
          medians,
          metrics: {
            lcp: median(runs.map((r) => r.metrics.lcp)),
            cls: median(runs.map((r) => r.metrics.cls)),
            tbt: median(runs.map((r) => r.metrics.tbt)),
          },
          all: runs.map((r) => r.scores),
        })
      }
    }
  } finally {
    server.kill()
  }

  const mark = (id, value) => (value >= config.targets[id] ? `${value}` : `**${value}** ⚠️`)
  const lines = [
    '# Auditoria Lighthouse',
    '',
    `Gerado em ${new Date().toISOString()} por \`npm run audit\` (configuração: \`lighthouse/audit.config.mjs\`).`,
    '',
    '## Ambiente',
    '',
    `- Lighthouse ${lighthouseVersion}`,
    `- Navegador: ${environment?.hostUserAgent ?? 'desconhecido'}`,
    `- Node ${process.version} · ${os.type()} ${os.release()} · ${os.cpus()[0]?.model ?? ''}`,
    `- Build de produção (\`vite build\`) servido por \`vite preview\`; mocks (MSW) ligados no cenário padrão`,
    `- ${config.runsPerPage} execuções por página e perfil, cada uma em um Chrome com perfil limpo; valores = mediana`,
    '- Perfil mobile: configuração padrão do Lighthouse (Moto G Power emulado, 4G lento simulado, CPU 4x mais lenta)',
    '- Perfil desktop: preset oficial `desktop-config` do Lighthouse',
    '',
    '## Medianas',
    '',
    '| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...rows.map(
      (r) =>
        `| ${r.page} | ${r.profile} | ${mark('performance', r.medians.performance)} | ${mark('accessibility', r.medians.accessibility)} | ${mark('best-practices', r.medians['best-practices'])} | ${mark('seo', r.medians.seo)} | ${(r.metrics.lcp / 1000).toFixed(2)} s | ${r.metrics.cls.toFixed(3)} | ${Math.round(r.metrics.tbt)} ms |`,
    ),
    '',
    'Metas: Performance ≥ 90, Acessibilidade ≥ 95, Boas práticas ≥ 95, SEO ≥ 90. ⚠️ = abaixo da meta.',
    '',
    '## Todas as execuções',
    '',
    ...rows.map(
      (r) =>
        `- ${r.page} · ${r.profile}: ${r.all.map((s) => `[${config.categories.map((id) => s[id]).join(' / ')}]`).join(' ')}`,
    ),
    '',
    'Relatórios HTML/JSON (execução de performance mediana) nesta pasta: `<página>-<perfil>.report.html|json`.',
    '',
  ]
  await writeFile(path.join(reportsDir, 'summary.md'), lines.join('\n'))
  console.log(`\nResumo salvo em ${path.join(reportsDir, 'summary.md')}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
