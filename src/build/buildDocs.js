import fs from "fs";
import path from "path";
import { createSearchIndex } from "./createSearchIndex.js";

const nojekyllPath = path.join(process.cwd(), "docs", ".nojekyll");
try {
  fs.writeFileSync(nojekyllPath, "");
  console.log(".nojekyll file created in docs/");
} catch (err) {
  console.error("Failed to write .nojekyll file:", err);
}
await createSearchIndex();
