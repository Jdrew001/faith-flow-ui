/// <reference types="vitest" />

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    includeSource: ['src/**/*.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'cobertura'],
      reportsDirectory: 'coverage',
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        '**/*.d.ts',
        '**/*.config.ts',
        'src/main.ts',
        'src/polyfills.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
        'coverage/**',
        // Skip Angular boilerplate files
        'src/test.ts',
        'src/zone-flags.ts',
        '**/*.module.ts',
        '**/*-routing.module.ts',
        '**/*.model.ts',
        '**/index.ts',
        // Skip environment files
        'src/environments/**'
      ],
      include: [
        'src/**/*.ts',
        'src/**/*.tsx'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    pool: 'threads',
    environmentOptions: {
      jsdom: {
        resources: 'usable'
      }
    },
    onConsoleLog: (log: string) => {
      if (log.includes('elm[aelFn] is not a function')) {
        return false;
      }
      return true;
    },
    // Add a custom reporter that filters out Ionic errors
    silent: false
  },
  define: {
    'import.meta.vitest': undefined,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'src/environments/environment': resolve(__dirname, 'src/environments/environment.ts'),
    },
  },
  esbuild: {
    target: 'esnext'
  },
  ssr: {
    noExternal: ['@ionic/angular', '@ionic/core']
  }
});
