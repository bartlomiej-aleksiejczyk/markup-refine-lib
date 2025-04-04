import { defineConfig } from "astro/config";
import { SITE, BASE, OUT_DIR } from "./src/site.config.js";

export default defineConfig({
  outDir: OUT_DIR,
  site: SITE,
  base: `/${BASE}/`, // Note: needs leading and trailing slashes
});
