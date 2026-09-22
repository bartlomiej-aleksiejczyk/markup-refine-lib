import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { libraryEntries } from "./src/library/package-entries.mjs";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const minified = mode === "library-minified";
  const suffix = minified ? ".min" : "";
  const entries = Object.fromEntries(
    Object.entries(libraryEntries).map(([name, source]) => [
      name,
      resolve(rootDir, source),
    ]),
  );

  return {
    plugins: [svelte()],
    build: {
      manifest: minified ? ".vite/manifest.min.json" : ".vite/manifest.json",
      outDir: resolve(rootDir, "dist"),
      emptyOutDir: !minified,
      cssCodeSplit: true,
      sourcemap: true,
      minify: minified ? "esbuild" : false,
      cssMinify: minified,
      lib: {
        entry: entries,
        name: "MarkupRefine",
        formats: ["es"],
      },
      rollupOptions: {
        output: {
          entryFileNames: `[name]${suffix}.js`,
          chunkFileNames: `chunks/[name]-[hash]${suffix}.js`,
          assetFileNames: `[name]${suffix}[extname]`,
        },
      },
    },
    server: {
      cors: true,
      watch: {
        usePolling: true,
      },
    },
  };
});
