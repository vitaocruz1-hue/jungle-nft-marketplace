import js from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    'dist',
    'playwright-report',
    'test-results',
    'public/mockServiceWorker.js',
    'src/routeTree.gen.ts',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
      pluginQuery.configs['flat/recommended'],
      pluginRouter.configs['flat/recommended'],
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    // - shadcn/ui exporta o componente e suas variantes (ex.: buttonVariants).
    // - Rotas exportam o objeto `Route`; o plugin do TanStack Router já cuida
    //   do hot reload desses arquivos.
    files: ['src/components/ui/**/*.tsx', 'src/routes/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // Regras da stack obrigatória: toda chamada REST passa pelo Axios e a
    // interface nunca acessa a API simulada diretamente.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/mocks/**', 'src/main.tsx'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Use o apiClient (Axios) de @/lib/api-client.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'fetch', message: 'Use o apiClient (Axios).' },
        { object: 'globalThis', property: 'fetch', message: 'Use o apiClient (Axios).' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/mocks', '@/mocks/*', '**/mocks', '**/mocks/*'],
              message: 'O app não pode importar a API simulada (src/mocks).',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression[source.value=/mocks/]',
          message: 'O app não pode importar a API simulada (src/mocks).',
        },
      ],
    },
  },
  {
    // Testes e arquivos de configuração rodam no Node, não no navegador.
    files: ['e2e/**/*.ts', '*.config.ts'],
    languageOptions: { globals: globals.node },
  },
])
