import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import mustachePlugin from './src/plugins/mustache-plugin';
import path from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log(__dirname);
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    mustachePlugin({
      templatesDir: path.resolve(__dirname, 'src/templates'),
      pagesDir: path.resolve(__dirname, 'src/pages'),
      baseTemplate: 'base.mustache',
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
});
