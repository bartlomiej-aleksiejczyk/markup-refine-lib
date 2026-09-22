import Fuse from "fuse.js";

type SearchMode = "static" | "dynamic";

type SearchItem = {
  title?: string;
  content?: string;
  url?: string;
};

export function initSearchTool(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-mr-search]").forEach((trigger) => {
    if (trigger.dataset.mrSearchInitialized === "true") return;
    trigger.dataset.mrSearchInitialized = "true";

    trigger.addEventListener("click", () => openSearch(trigger));
  });
}

async function openSearch(trigger: HTMLElement) {
  const staticUrl = trigger.getAttribute("data-mr-search-static-url") || "";
  const dynamicUrl = trigger.getAttribute("data-mr-search-dynamic-url") || "";
  const mode: SearchMode | null =
    staticUrl && !dynamicUrl ? "static" : dynamicUrl && !staticUrl ? "dynamic" : null;

  if (!mode) {
    console.warn(
      "Markup Refine search needs exactly one of data-mr-search-static-url or data-mr-search-dynamic-url.",
    );
    return;
  }

  const existing = document.querySelector<HTMLDialogElement>(
    'dialog[data-mr-search-part="dialog"][open]',
  );
  if (existing) return;

  const {
    dialog,
    input,
    results,
    searchIcon,
    spinner,
    message,
    dismissButton,
    resultCount,
  } = createSearchDialog();

  document.body.appendChild(dialog);
  dialog.showModal();
  input.focus();

  let fuse: Fuse<SearchItem> | null = null;
  let loadingFailed = false;

  const close = () => {
    if (dialog.open) dialog.close();
  };

  dialog.addEventListener("close", () => {
    dialog.remove();
    trigger.focus();
  }, { once: true });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inside) close();
  });
  dismissButton.addEventListener("click", close);

  if (mode === "static") {
    setLoading(true, searchIcon, spinner);
    try {
      const response = await fetch(staticUrl);
      if (!response.ok) throw new Error(`Search index request failed with ${response.status}`);
      const dataset = (await response.json()) as SearchItem[];
      fuse = new Fuse(dataset, {
        includeScore: false,
        includeMatches: true,
        useExtendedSearch: true,
        minMatchCharLength: 2,
        distance: 10000,
        threshold: 0.4,
        keys: [
          { name: "title", weight: 0.7 },
          { name: "content", weight: 0.3 },
        ],
      });
    } catch (error) {
      loadingFailed = true;
      message.hidden = false;
      message.textContent = "⚠️ Failed to load search index, please refresh the page.";
      console.error("Static search index fetch failed:", error);
    } finally {
      setLoading(false, searchIcon, spinner);
    }
  }

  let debounceId: number | null = null;
  const debounceMs = 800;

  input.addEventListener("input", () => {
    const query = input.value.trim();

    if (debounceId !== null) {
      clearTimeout(debounceId);
      debounceId = null;
    }

    if (!query) {
      clearSearchUi(results, message, resultCount);
      setLoading(false, searchIcon, spinner);
      return;
    }

    debounceId = window.setTimeout(() => {
      void performSearch(query);
    }, debounceMs);
  });

  async function performSearch(query: string) {
    clearSearchUi(results, message, resultCount);
    if (!loadingFailed) setLoading(true, searchIcon, spinner);

    if (mode === "static" && fuse) {
      const searchResults = fuse.search(query);
      renderResultSummary(searchResults.length, message, resultCount);
      searchResults.forEach((result) => {
        appendResult(results, result.item, result.matches || [], result.score ?? null);
      });
      setLoading(false, searchIcon, spinner);
      return;
    }

    if (mode === "dynamic") {
      try {
        const response = await fetch(dynamicUrl + encodeURIComponent(query));
        if (!response.ok) throw new Error(`Search request failed with ${response.status}`);
        const data = (await response.json()) as { results?: SearchItem[] };
        const dynamicResults = Array.isArray(data.results) ? data.results : [];
        renderResultSummary(dynamicResults.length, message, resultCount);
        dynamicResults.forEach((item) => appendResult(results, item));
      } catch (error) {
        message.hidden = false;
        message.textContent = "🔎 Failed to fetch results.";
        console.error("Dynamic search failed:", error);
      } finally {
        setLoading(false, searchIcon, spinner);
      }
    }
  }

function appendResult(
  container: HTMLElement,
  item: SearchItem,
  matches: any[] = [],
  score: number | null = null
) {
  const li = document.createElement("li");
  li.className = "mr-search__result";
  li.setAttribute("data-mr-search-part", "result");

  let wrapper: HTMLAnchorElement | HTMLDivElement;
  if (item.url) {
    const anchor = document.createElement("a");
    anchor.href = item.url;
    anchor.target = "_blank";
    anchor.className = "mr-search__result-link";
    anchor.setAttribute("data-mr-search-part", "result-link");
    wrapper = anchor;
  } else {
    wrapper = document.createElement("div");
  }

  const titleEl = document.createElement("strong");
  const contentEl = document.createElement("div");

  const titleMatch = matches.find((m: any) => m.key === "title");
  const contentMatch = matches.find((m: any) => m.key === "content");
  const mergedTitleIndices = mergeRanges(titleMatch?.indices || []);

  // Title
  const titleText = item.title || "";
  if (mergedTitleIndices.length > 0) {
    renderHighlightedText(titleEl, titleText, mergedTitleIndices);
  } else {
    titleEl.textContent = titleText;
  }

  // Content snippet
  const fullContent = item.content || "";
  const truncated = truncateToMatch(
    fullContent,
    contentMatch?.indices || [],
    200
  );
  const mergedTruncatedTextIndices = mergeRanges(truncated.adjustedIndices);

  if (mergedTruncatedTextIndices.length > 0) {
    renderHighlightedText(
      contentEl,
      truncated.text,
      mergedTruncatedTextIndices
    );
  } else {
    contentEl.textContent = truncated.text;
  }

  wrapper.appendChild(titleEl);
  wrapper.appendChild(contentEl);

  // Optional score display (only used in static mode)
  if (score !== null) {
    const scoreEl = document.createElement("div");
    scoreEl.style.fontSize = "0.8em";
    scoreEl.style.color = "gray";
    scoreEl.textContent = `Score: ${(score * 100).toFixed(1)}%`;
    wrapper.appendChild(scoreEl);
  }

  li.appendChild(wrapper);
  container.appendChild(li);
}

function truncateToMatch(
  text: string,
  indices: [number, number][],
  maxLen: number,
): { text: string; adjustedIndices: [number, number][] } {
  if (text.length <= maxLen || indices.length === 0) {
    return {
      text: text.slice(0, maxLen),
      adjustedIndices: indices.filter(([s, e]) => s < maxLen),
    };
  }

  // longest match
  const [matchStart, matchEnd] = indices.reduce((longest, current) => {
    const [s1, e1] = longest;
    const [s2, e2] = current;
    return e2 - s2 > e1 - s1 ? current : longest;
  });

  const matchCenter = Math.floor((matchStart + matchEnd) / 2);
  const start = Math.max(0, matchCenter - Math.floor(maxLen / 2));
  const end = Math.min(text.length, start + maxLen);
  const sliced = text.slice(start, end);

  const adjustedStart = matchStart - start;
  const adjustedEnd = matchEnd - start;

  const adjustedIndices: [number, number][] =
    adjustedStart >= 0 && adjustedEnd < sliced.length
      ? [[adjustedStart, adjustedEnd]]
      : [];

  return { text: sliced, adjustedIndices };
}

function renderHighlightedText(
  parent: HTMLElement,
  text: string,
  indices: [number, number][]
) {
  let lastIndex = 0;

  for (const [start, end] of indices) {
    if (end - start + 1 < 2) continue; // Skip 1-char matches

    if (lastIndex < start) {
      const span = document.createTextNode(text.slice(lastIndex, start));
      parent.appendChild(span);
    }

    const mark = document.createElement("mark");
    mark.textContent = text.slice(start, end + 1);
    parent.appendChild(mark);

    lastIndex = end + 1;
  }

  if (lastIndex < text.length) {
    const span = document.createTextNode(text.slice(lastIndex));
    parent.appendChild(span);
  }
}

}

function createSearchDialog() {
  const dialog = document.createElement("dialog");
  dialog.className = "mr-search";
  dialog.setAttribute("data-mr-search-part", "dialog");
  dialog.setAttribute("aria-label", "Search");

  const input = document.createElement("input");
  input.className = "mr-search__input";
  input.setAttribute("data-mr-search-part", "input");
  input.type = "search";
  input.placeholder = "Search...";
  input.autocomplete = "off";
  input.autofocus = true;
  input.setAttribute("aria-label", "Search query");

  const dismissButton = document.createElement("button");
  dismissButton.className = "mr-search__dismiss";
  dismissButton.setAttribute("data-mr-search-part", "dismiss");
  dismissButton.setAttribute("aria-label", "Close search");
  dismissButton.type = "button";
  dismissButton.innerHTML = `
    <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
      <path d="m251.33-204.67-46.66-46.66L433.33-480 204.67-708.67l46.66-46.66L480-526.67l228.67-228.66 46.66 46.66L526.67-480l228.66 228.67-46.66 46.66L480-433.33 251.33-204.67Z"/>
    </svg>`;

  const searchIcon = document.createElement("div");
  searchIcon.className = "mr-search__icon";
  searchIcon.setAttribute("data-mr-search-part", "icon");
  searchIcon.setAttribute("aria-hidden", "true");
  searchIcon.innerHTML = `
    <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" height="35px" viewBox="0 -960 960 960" width="35px">
      <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
    </svg>`;

  const spinner = document.createElement("div");
  spinner.classList.add("mr-search__spinner", "mr-search__icon");
  spinner.setAttribute("data-mr-search-part", "spinner");
  spinner.setAttribute("aria-hidden", "true");
  spinner.hidden = true;

  const message = document.createElement("div");
  message.className = "mr-search__message";
  message.setAttribute("data-mr-search-part", "message");
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");
  message.hidden = true;

  const resultCount = document.createElement("div");
  resultCount.className = "mr-search__count";
  resultCount.setAttribute("data-mr-search-part", "count");
  resultCount.setAttribute("role", "status");
  resultCount.setAttribute("aria-live", "polite");
  resultCount.hidden = true;

  const results = document.createElement("ul");
  results.className = "mr-search__results";
  results.setAttribute("data-mr-search-part", "results");

  dialog.append(dismissButton, input, searchIcon, spinner, message, resultCount, results);
  return { dialog, input, results, searchIcon, spinner, message, dismissButton, resultCount };
}

function clearSearchUi(results: HTMLElement, message: HTMLElement, resultCount: HTMLElement) {
  results.replaceChildren();
  message.textContent = "";
  message.hidden = true;
  resultCount.textContent = "";
  resultCount.hidden = true;
}

function setLoading(loading: boolean, searchIcon: HTMLElement, spinner: HTMLElement) {
  searchIcon.hidden = loading;
  spinner.hidden = !loading;
}

function renderResultSummary(count: number, message: HTMLElement, resultCount: HTMLElement) {
  if (count === 0) {
    message.hidden = false;
    message.textContent = "No results found.";
    return;
  }

  resultCount.hidden = false;
  resultCount.textContent = `Found ${count} result(s).`;
}

function mergeRanges(ranges: [number, number][]): [number, number][] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];

  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (!last || start > last[1]) {
      merged.push([start, end]);
    } else {
      last[1] = Math.max(last[1], end);
    }
  }

  return merged;
}
