import { defineConfig } from 'vitest/config';

// Config propria para rodar os testes em ambiente Node sem carregar plugins de build do Vite.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    environment: 'node',
  },
});
