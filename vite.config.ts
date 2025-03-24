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
        resolve(__dirname, "src", "allComponents.ts"),
        resolve(__dirname, "src", "class_light_style_library.ts"),
        resolve(__dirname, "src", "class_style_library.ts"),
      ],
      name: "OfflineNotesClientComponents",
      formats: ["es"],
    },
  },
});
