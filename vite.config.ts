import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log(__dirname);
// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    manifest: true,
    outDir: resolve(__dirname, "dist"),
    cssCodeSplit: true,
    lib: {
      entry: [
        resolve(
          __dirname,
          "src",
          "library",
          "markup-refine-lib-javascript-attribute-components.ts"
        ),
                resolve(
          __dirname,
          "src",
          "library",
          "index.ts"
        ),
        resolve(
          __dirname,
          "src",
          "library",
          "markup-refine-lib-classless-base.css"
        ),
        resolve(__dirname, "src", "library", "markup-refine-lib.css"),
        resolve(__dirname, "src", "library", "markup-refine-lib-variables.css"),
        resolve(__dirname, "src", "library", "markup-refine-lib-reset.css"),
        resolve(
          __dirname,
          "src",
          "library",
          "markup-refine-lib-class-components.css"
        ),
        resolve(
          __dirname,
          "src",
          "library",
          "markup-refine-lib-classless-base-scoped.scss"
        ),
      ],
      name: "OfflineNotesClientComponents",
      formats: ["es"],
    },
  },
  server: {
    cors: true,
    watch: {
      usePolling: true,
    },
  },
});
