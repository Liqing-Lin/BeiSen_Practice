import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/BeiSen_Practice/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});