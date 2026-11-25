import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // `@/algo` aponta para `src/algo` (o mesmo atalho está no tsconfig.app.json)
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
