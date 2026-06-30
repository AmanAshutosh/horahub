import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
    // Resolve the `server-only` guard to its no-op build so server modules
    // (e.g. the Swiss adapter) can be unit-tested in the node environment.
    conditions: ['react-server'],
  },
  test: { environment: 'node', include: ['tests/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'] },
});
