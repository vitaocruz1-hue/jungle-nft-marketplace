import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // Precisa vir antes do plugin do React: gera src/routeTree.gen.ts a partir de src/routes/.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // `@/algo` aponta para `src/algo` (o mesmo atalho está no tsconfig.app.json).
      // Caminho "real" do disco, igual ao que o Vite usa para o index.html. No Windows,
      // o terminal pode informar a letra do disco em outra caixa (c: × C:); com dois
      // caminhos para o mesmo arquivo, o bundler carregava o React duas vezes.
      '@': realpathSync.native(resolve('src')),
    },
  },
})
