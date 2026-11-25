import { fileURLToPath, URL } from 'node:url'
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
      // `@/algo` aponta para `src/algo` (o mesmo atalho está no tsconfig.app.json)
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
