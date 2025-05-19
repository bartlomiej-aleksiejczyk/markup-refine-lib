export function searchInDataset(dataset, query, options = {}) {
  const {
    keys = ["title", "content"],
    caseSensitive = false,
    minMatchCharLength = 3,
  } = options;

  if (!caseSensitive) query = query.toLowerCase();
  if (query.length < minMatchCharLength) return [];

  const results = [];

  for (const item of dataset) {
    const matches = [];

    for (const key of keys) {
      const field = item[key];
      if (typeof field !== "string") continue;

      const haystack = caseSensitive ? field : field.toLowerCase();
      const index = haystack.indexOf(query);

      if (index !== -1) {
        matches.push({
          key,
          indices: [[index, index + query.length - 1]],
        });
      }
    }

    if (matches.length > 0) {
      results.push({
        item,
        matches,
        score: 1 - query.length / (item.title?.length || 100), // basic score
      });
    }
  }

  return results;
}
