import { Liquid } from "liquidjs";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { globalContext } from "../pages/context.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const paths = {
  pages: path.resolve(__dirname, "../pages"),
  docs: path.resolve(__dirname, "../../docs"),
  layouts: path.resolve(__dirname, "../pages/layouts"),
};

const engine = new Liquid({
  root: paths.pages,
  extname: ".liquid",
  cache: false,
  dynamicPartials: true,
  layouts: paths.layouts,
});

/**
 * Recursively walk directory and collect .liquid and .html files (excluding layouts)
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function getRelevantFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      // Skip layouts dir entirely
      if (fullPath.startsWith(paths.layouts)) return [];

      if (entry.isDirectory()) {
        return getRelevantFiles(fullPath);
      }

      if (
        entry.isFile() &&
        (entry.name.endsWith(".liquid") || entry.name.endsWith(".html"))
      ) {
        return [fullPath];
      }

      return [];
    })
  );

  return files.flat();
}

/**
 * Build docs from .liquid and passthrough .html
 */
async function buildDocs() {
  try {
    await fs.mkdir(paths.docs, { recursive: true });

    const files = await getRelevantFiles(paths.pages);

    for (const fullPath of files) {
      const relativePath = path.relative(paths.pages, fullPath);
      const outputPath = path.join(
        paths.docs,
        relativePath.replace(/\.liquid$/, ".html")
      );

      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      try {
        if (fullPath.endsWith(".html")) {
          // Passthrough copy
          const content = await fs.readFile(fullPath);
          await fs.writeFile(outputPath, content);
          console.log(`Copied: ${outputPath}`);
        } else if (fullPath.endsWith(".liquid")) {
          const templateName = relativePath.replace(/\.liquid$/, "");
          const html = await engine.renderFile(templateName, {
            ...globalContext,
            current_url: "/" + templateName,
          });
          await fs.writeFile(outputPath, html);
          console.log(`Built: ${outputPath}`);
        }
      } catch (err) {
        console.error(`❌ Error processing ${relativePath}:`, err);
      }
    }

    console.log("✅ Documentation build completed.");
  } catch (err) {
    console.error("🚫 Build failed:", err);
    process.exit(1);
  }
}

buildDocs();
