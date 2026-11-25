/**
 * Configuração lida das variáveis de ambiente (arquivo .env ou painel da Vercel).
 * Todo o app lê daqui, nunca direto de `import.meta.env`.
 */
export const env = {
  /** API simulada (MSW) ligada por padrão. Use VITE_ENABLE_MOCKS=false para desligar. */
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS !== 'false',
  /** Endereço base da API REST. */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
} as const
