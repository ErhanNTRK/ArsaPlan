import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * base: './' → göreli yollar. Repo adı ne olursa olsun (ArsaPlan, Arsa-Deger-Analizi…)
 * GitHub Pages'te sorunsuz çalışır; repo adını değiştirdiğinizde burada düzeltme gerekmez.
 */
export default defineConfig({
  plugins: [react()],
  base: './',
});
