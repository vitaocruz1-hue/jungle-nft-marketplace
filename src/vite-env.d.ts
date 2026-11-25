/// <reference types="vite/client" />

// Tipos das variáveis de ambiente lidas pelo app (ver .env.example).
interface ImportMetaEnv {
  readonly VITE_ENABLE_MOCKS?: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
