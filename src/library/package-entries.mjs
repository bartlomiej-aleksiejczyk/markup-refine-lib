/** Stable library build entry points. */
export const libraryEntries = Object.freeze({
  "markup-refine-lib": "src/library/markup-refine-lib.css",
  "markup-refine-lib-tokens": "src/library/markup-refine-lib-tokens.css",
  "markup-refine-lib-base": "src/library/markup-refine-lib-base.css",
  "markup-refine-lib-components": "src/library/markup-refine-lib-components.css",
  "markup-refine-lib-layout": "src/library/markup-refine-lib-layout.css",
  "markup-refine-lib-behaviors": "src/library/markup-refine-lib-behaviors.ts",
  "markup-refine-lib-layers": "src/library/markup-refine-lib-layers.ts",
  "markup-refine-lib-tooltips": "src/library/markup-refine-lib-tooltips.ts",
  "markup-refine-lib-layer-navigation": "src/library/markup-refine-lib-layer-navigation.ts",
});

export const stableEntryNames = Object.freeze(Object.keys(libraryEntries));

export function outputFile(entryName, minified = false) {
  const source = libraryEntries[entryName];
  if (!source) throw new Error(`Unknown library entry: ${entryName}`);
  const extension = /\.(?:css|scss)$/.test(source) ? ".css" : ".js";
  return `${entryName}${minified ? ".min" : ""}${extension}`;
}
