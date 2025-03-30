import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import liquidPlugin from './src/build/plugins/vite-plugin-liquid';

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log(__dirname);
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    liquidPlugin(),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MarkupRefineLib',
      fileName: (format) => `markup-refine-lib.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['svelte'],
      output: {
        globals: {
          svelte: 'Svelte'
        }
      }
    }
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  server: {
    watch: {
      usePolling: true
    }
  }
});
