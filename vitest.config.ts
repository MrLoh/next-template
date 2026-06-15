import react from '@vitejs/plugin-react'
import { workflow } from '@workflow/vitest'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), workflow()],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    env: { NODE_ENV: 'test' },
    globalSetup: ['./vitest.setup.ts'],
    setupFiles: ['./src/test-helpers.ts'],
    projects: [
      { extends: true, test: { name: 'node', environment: 'node', include: ['**/*.test.ts'] } },
      { extends: true, test: { name: 'jsdom', environment: 'jsdom', include: ['**/*.test.tsx'] } },
    ],
  },
})
