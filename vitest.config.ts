import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['dist/**', 'node_modules/**', '**/*.config.*', 'examples/**', '**/*.d.ts'],
    },
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules/**', 'dist/**', 'examples/**'],
  },
});
