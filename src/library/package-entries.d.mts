export const libraryEntries: Readonly<Record<string, string>>;
export const stableEntryNames: readonly string[];
export function outputFile(entryName: string, minified?: boolean): string;
