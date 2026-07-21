import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages alt dizinde yayınlanır: /Arsa-Deger-Analizi/
// Repo adını değiştirirsen BURAYI da değiştir.
export default defineConfig({
  plugins: [react()],
  base: '/Arsa-Deger-Analizi/',
});
