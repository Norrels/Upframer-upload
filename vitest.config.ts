import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],

      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },

      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.config.{js,ts}',
        '**/env.ts',
        'src/server.ts',
        'src/config/**',
        'src/infrastructure/adapters/out/persistence/schemas/**'
      ]
    },

    testTimeout: 10000,
    hookTimeout: 10000,

    globals: true
  },

  resolve: {
    alias: {
      '@': '/src'
    }
  }
});