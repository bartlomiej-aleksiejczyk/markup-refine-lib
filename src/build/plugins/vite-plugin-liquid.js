// @ts-check

import { Liquid } from "liquidjs";
import fs from "fs/promises";
import path from "path";
import { globalContext } from "../../pages/context.js";

/**
 * @typedef {import('vite').Plugin} VitePlugin
 * @typedef {import('vite').ViteDevServer} ViteDevServer
 * @typedef {import('vite').HmrContext} HmrContext
 */

/**
 * Vite plugin to serve .liquid and .html pages via file-based routing
 * @returns {VitePlugin}
 */
export default function liquidPlugin() {
  const rootPagesDir = path.resolve("src/pages");
  const engine = new Liquid({
    root: rootPagesDir,
    extname: ".liquid",
    cache: false,
    dynamicPartials: true,
    layouts: path.resolve(rootPagesDir, "layouts"),
  });

  return {
    name: "vite-plugin-liquid",

    /**
     * Dev server middleware for file-based routing.
     * @param {ViteDevServer} server
     */
    async configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !res) return next();
        let url = req.url.split("?")[0];

        if (url.endsWith("/")) url = url.slice(0, -1);
        if (url === "") url = "/index";

        const relativePath = url.slice(1); // remove leading slash
        const htmlPath = path.join(rootPagesDir, `${relativePath}.html`);
        const liquidPath = path.join(rootPagesDir, `${relativePath}.liquid`);

        try {
          // If .html file exists, serve it directly
          try {
            const htmlContent = await fs.readFile(htmlPath, "utf-8");
            res.setHeader("Content-Type", "text/html");
            res.end(htmlContent);
            return;
          } catch {
            // .html file doesn't exist, continue to .liquid
          }

          // If .liquid exists, render and serve it
          const liquidContent = await engine.renderFile(
            path.relative(rootPagesDir, liquidPath),
            {
              ...globalContext,
              current_url: url,
            }
          );

          res.setHeader("Content-Type", "text/html");
          res.end(liquidContent);
        } catch (e) {
          return next(); // fallback to default behavior
        }
      });
    },

    /**
     * Transform .liquid files to static HTML at build time
     * @param {string} code
     * @param {string} id
     * @returns {Promise<{ code: string, map: null } | null>}
     */
    async transform(code, id) {
      if (!id.endsWith(".liquid")) return null;

      try {
        const templatePath = path.relative(rootPagesDir, id);
        const html = await engine.renderFile(templatePath, {
          ...globalContext,
          current_url: templatePath.replace(".liquid", ""),
        });

        return {
          code: `export default ${JSON.stringify(html)}`,
          map: null,
        };
      } catch (error) {
        console.error(`Error processing Liquid template ${id}:`, error);
        return null;
      }
    },

    /**
     * Invalidate layout/context changes on hot reload
     * @param {HmrContext} context
     */
    async handleHotUpdate({ file, server }) {
      if (
        file.endsWith(".liquid") ||
        file.endsWith(".html") ||
        file.includes("/layouts/") ||
        file.includes("/pages/context.js")
      ) {
        server.moduleGraph.invalidateAll();
      }
    },
  };
}
