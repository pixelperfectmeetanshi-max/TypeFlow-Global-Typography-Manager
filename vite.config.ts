import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import zipPack from 'vite-plugin-zip-pack';

export default defineConfig({
  plugins: [
    react(),
    zipPack({
      outDir: '.',
      outFileName: 'plugin.zip',
      filter: (fileName) => !/\.map$/.test(fileName),
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    copyPublicDir: true,
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
