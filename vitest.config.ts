import { defineConfig } from 'vitest/config';

// Config propria: o vite.config.ts carrega o plugin de PWA, que nao faz sentido nos testes.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
