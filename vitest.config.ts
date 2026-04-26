import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      $lib: '/src/lib',
      $ciphers: '/src/ciphers',
      $components: '/src/components',
      $islands: '/src/islands',
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
