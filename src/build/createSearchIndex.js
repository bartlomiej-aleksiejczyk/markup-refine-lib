import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM } from "jsdom"; // ✅ Add this to use DOMParser-like functionality

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Recursively walk a directory and collect all .html files
 */
async function walkDir(dir, fileList = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

/**
 * Extract title and <main> content using jsdom
 */
function extractTitleAndMain(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const title =
    document.querySelector("h1")?.textContent?.trim() ||
    document.querySelector("title")?.textContent?.trim() ||
    document.querySelector("h2")?.textContent?.trim() ||
    "Untitled";

  const main =
    document.querySelector("main")?.textContent?.replace(/\s+/g, " ").trim() ||
    "";

  return { title, content: main };
}

/**
 * Build index entry from HTML file
 */
async function extractFromHtml(filePath, basePath, urlPrefix) {
  const html = await fs.readFile(filePath, "utf-8");
  const { title, content } = extractTitleAndMain(html);

  const relativeUrl =
    urlPrefix + "/" + path.relative(basePath, filePath).replace(/\\/g, "/");
  return {
    title,
    content,
    url: relativeUrl.replace(/index\.html$/, ""),
  };
}

/**
 * Generate index array from all HTML files
 */
async function buildSearchIndex(rootPath, basePath = rootPath, urlPrefix = "") {
  const htmlFiles = await walkDir(rootPath);
  const index = [];

  for (let i = 0; i < htmlFiles.length; i++) {
    try {
      const item = await extractFromHtml(htmlFiles[i], basePath, urlPrefix);
      index.push({ id: i + 1, ...item });
    } catch (err) {
      console.warn(`Failed to process ${htmlFiles[i]}:`, err.message);
    }
  }

  return index;
}

/**
 * Main export: create and write search index to file
 */
export async function createSearchIndex(
  rootDir = "../../docs",
  outputFile = "docs/search-index.json",
  urlPrefix = "/markup-refine-lib"
) {
  const rootPath = path.resolve(__dirname, rootDir);
  const index = await buildSearchIndex(rootPath, rootPath, urlPrefix);
  await fs.writeFile(outputFile, JSON.stringify(index, null, 2));
  console.log(`Search index written to ${outputFile}`);
}
