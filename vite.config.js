import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// No domínio próprio o site vive na raiz ('/'). No endereço do GitHub
// (utilizador.github.io/maocerta-site/) vive numa subpasta; o workflow passa-a em BASE_PATH.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        privacidade: resolve(import.meta.dirname, 'privacidade.html'),
      },
    },
  },
});
