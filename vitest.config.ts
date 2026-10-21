import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Vitest configuration for the Heptome frontend.
 *
 * The `@/…` alias mirrors `tsconfig.json` paths, and JSX is transformed with
 * React's automatic runtime (the app never imports React explicitly). Tests run
 * in jsdom because most of the behaviour worth pinning down lives in client
 * components (localStorage drafts, query-string hand-off, coverage checks).
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
})
