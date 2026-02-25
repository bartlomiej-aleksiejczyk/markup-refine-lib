import { createSearchIndex } from "./createSearchIndex.js";

await createSearchIndex(
  "../../docs",
  "search-index.json",
  "/markup-refine-lib",
);
