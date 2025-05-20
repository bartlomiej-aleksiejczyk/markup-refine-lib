const fs = require("fs/promises");
const path = require("path");

// Recursively walks through a directory and finds all .html files
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

// Basic HTML parsing using regex (not suitable for complex HTML but fine here)
function extractTitleAndContent(html) {
  const getTagContent = (tag) => {
    const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "is");
    const match = html.match(regex);
    return match ? match[1].replace(/<[^>]*>/g, "").trim() : "";
  };

  const title =
    getTagContent("h1") ||
    getTagContent("title") ||
    getTagContent("h2") ||
    "Untitled";

  const body = getTagContent("body").replace(/\s+/g, " ").trim();

  return { title, content: body };
}

async function extractFromHtml(filePath, basePath) {
  const html = await fs.readFile(filePath, "utf-8");
  const { title, content } = extractTitleAndContent(html);

  const relativeUrl =
    "/" + path.relative(basePath, filePath).replace(/\\/g, "/");
  return {
    title,
    content,
    url: relativeUrl.replace(/index\.html$/, ""), // clean URLs
  };
}

async function createSearchIndex(rootPath, basePath = rootPath) {
  const htmlFiles = await walkDir(rootPath);
  const index = [];

  for (let i = 0; i < htmlFiles.length; i++) {
    try {
      const item = await extractFromHtml(htmlFiles[i], basePath);
      index.push({ id: i + 1, ...item });
    } catch (err) {
      console.warn(`Failed to process ${htmlFiles[i]}:`, err.message);
    }
  }

  return index;
}

// Example usage
export async function createSearchIndex(rootDir, globalPrefix) {
  const rootPath = path.resolve(__dirname, rootDir); // change as needed
  const index = await createSearchIndex(rootPath);
  await fs.writeFile("search-index.json", JSON.stringify(index, null, 2));
  console.log("Search index written to search-index.json");
}
