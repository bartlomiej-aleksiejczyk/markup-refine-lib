/** Stable library build entry points. */
export const libraryEntries = Object.freeze({
  "markup-refine-lib": "src/library/markup-refine-lib.css",
  "markup-refine-lib-behaviors": "src/library/markup-refine-lib-behaviors.ts",
});

export const stableEntryNames = Object.freeze(Object.keys(libraryEntries));

export function outputFile(entryName, minified = false) {
  const source = libraryEntries[entryName];
  if (!source) throw new Error(`Unknown library entry: ${entryName}`);
  const extension = /\.(?:css|scss)$/.test(source) ? ".css" : ".js";
  return `${entryName}${minified ? ".min" : ""}${extension}`;
}
