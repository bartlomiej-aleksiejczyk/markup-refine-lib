import Fuse from "fuse.js";
// import { searchInDataset } from "./searchInDataset"; // still unused, can be removed

export function initSearchTool() {
  const triggers = document.querySelectorAll("[data-search-tool]");

  for (const btn of triggers) {
    btn.addEventListener("click", async () => {
      const staticUrl = btn.getAttribute("data-static-url") || "";
      const dynamicUrl = btn.getAttribute("data-dynamic-url") || "";
      // TODO: Add a hybrid mode
      const mode: "static" | "dynamic" | null =
        staticUrl && !dynamicUrl
          ? "static"
          : dynamicUrl && !staticUrl
          ? "dynamic"
          : null;
      let isLoadingFailed = false;

      const {
        overlay,
        modal,
        input,
        results,
        searchIcon,
        spinner,
        message,
        dismissBtn,
        resultCount,
      } = createSearchModalElements();

      document.body.appendChild(overlay);
      document.body.appendChild(modal);

      message.style.display = "none";
      resultCount.style.display = "none";

      input.focus();

      let fuse: Fuse<any> | null = null;
      let dataset: any[] | null = null;

      // --- STATIC MODE: load dataset once ------------------------------------
      if (mode === "static" && staticUrl) {
        searchIcon.style.display = "none";
        spinner.style.display = "block";
        try {
          const res = await fetch(staticUrl);
          dataset = await res.json();

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
        } catch (err) {
          isLoadingFailed = true;
          message.style.display = "block";
          message.textContent =
            "⚠️ Failed to load search index, please refresh the page.";
          console.error("Static fetch failed:", err);
        } finally {
          spinner.style.display = "none";
          searchIcon.style.display = "block";
        }
      }

      // --- SEARCH LOGIC (extracted so we can debounce it) --------------------
      async function performSearch(query: string) {
        results.innerHTML = "";

        // reset info UI
        message.textContent = "";
        message.style.display = "none";
        resultCount.textContent = "";
        resultCount.style.display = "none";

        if (!query) {
          spinner.style.display = "none";
          searchIcon.style.display = "none";
          return;
        }

        if (!isLoadingFailed) {
          searchIcon.style.display = "none";
          spinner.style.display = "block";
        }

        // --- STATIC SEARCH ---------------------------------------------------
        if (mode === "static" && fuse) {
          const searchResults = fuse.search(query);

          if (searchResults.length === 0) {
            message.style.display = "block";
            message.textContent = "No results found.";
          } else {
            resultCount.style.display = "block";
            resultCount.textContent = `Found ${searchResults.length} result(s).`;

            searchResults.forEach((result) => {
              appendResult(
                results,
                result.item,
                result.matches || [],
                result.score ?? null
              );
            });
          }

          spinner.style.display = "none";
          searchIcon.style.display = "block";
          return;
        }

        // --- DYNAMIC SEARCH (global search API) ------------------------------
        if (mode === "dynamic" && dynamicUrl) {
          try {
            const res = await fetch(dynamicUrl + encodeURIComponent(query));
            const data = await res.json();

            // EXPECTED SHAPE: { results: [{ title, content, url }, ...] }
            const dynamicResults = Array.isArray(data.results)
              ? data.results
              : [];

            if (dynamicResults.length === 0) {
              message.style.display = "block";
              message.textContent = "No results found.";
            } else {
              resultCount.style.display = "block";
              resultCount.textContent = `Found ${dynamicResults.length} result(s).`;

              dynamicResults.forEach((item: any) => {
                // item: { title, content, url }
                appendResult(results, item);
              });
            }
          } catch (err) {
            message.style.display = "block";
            message.textContent = "🔎 Failed to fetch results.";
            console.error("Dynamic fetch failed:", err);
          } finally {
            spinner.style.display = "none";
            searchIcon.style.display = "block";
          }
        }
      }

      // --- INPUT HANDLER WITH SIMPLE DEBOUNCE -------------------------------
      let debounceId: number | null = null;
      // TODO: add customization by attribute, remove dynamic/static declaration
      const DEBOUNCE_MS = 800;

      input.addEventListener("input", () => {
        const query = input.value.trim();

        // If user cleared the input, immediately clear UI & cancel pending search
        if (!query) {
          if (debounceId !== null) {
            clearTimeout(debounceId);
            debounceId = null;
          }
          results.innerHTML = "";
          message.textContent = "";
          message.style.display = "none";
          resultCount.textContent = "";
          resultCount.style.display = "none";
          spinner.style.display = "none";
          searchIcon.style.display = "block";
          return;
        }

        // debounce
        if (debounceId !== null) {
          clearTimeout(debounceId);
        }
        debounceId = window.setTimeout(() => {
          performSearch(query);
        }, DEBOUNCE_MS);
      });

      // --- CLOSE HANDLERS ----------------------------------------------------
      overlay.onclick = () => closeModal(modal, overlay);
      dismissBtn.onclick = () => closeModal(modal, overlay);

      document.addEventListener("keydown", function escHandler(e) {
        if (e.key === "Escape") {
          closeModal(modal, overlay);
          document.removeEventListener("keydown", escHandler);
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // DOM helpers
  // -------------------------------------------------------------------------
  function createSearchModalElements() {
    const overlay = document.createElement("div");
    overlay.className = "search-tool-overlay";

    const modal = document.createElement("div");
    modal.className = "search-tool-modal";

    const input = document.createElement("input");
    input.className = "search-tool-input";
    input.type = "text";
    input.placeholder = "Search...";

    const dismissBtn = document.createElement("button");
    dismissBtn.className = "search-tool-dismiss";

    dismissBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
        <path d="m251.33-204.67-46.66-46.66L433.33-480 204.67-708.67l46.66-46.66L480-526.67l228.67-228.66 46.66 46.66L526.67-480l228.66 228.67-46.66 46.66L480-433.33 251.33-204.67Z"/>
      </svg>`;

    const searchIcon = document.createElement("div");
    searchIcon.className = "search-tool-input-icon";
    searchIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" height="35px" viewBox="0 -960 960 960" width="35px">
      <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
    </svg>`;

    const spinner = document.createElement("div");
    spinner.classList.add("search-tool-spinner", "search-tool-input-icon");
    spinner.textContent = "";
    spinner.style.display = "none";

    const message = document.createElement("div");
    message.className = "search-tool-message";

    const resultCount = document.createElement("div");
    resultCount.className = "search-tool-result-count";

    const results = document.createElement("ul");
    results.className = "search-tool-results";

    modal.appendChild(dismissBtn);
    modal.appendChild(input);
    modal.appendChild(searchIcon);
    modal.appendChild(spinner);
    modal.appendChild(message);
    modal.appendChild(resultCount);
    modal.appendChild(results);

    return {
      overlay,
      modal,
      input,
      results,
      searchIcon,
      spinner,
      message,
      dismissBtn,
      resultCount,
    };
  }

  function appendResult(
    container: HTMLElement,
    item: { title?: string; content?: string; url?: string },
    matches: any[] = [],
    score: number | null = null
  ) {
    const li = document.createElement("li");
    li.className = "search-tool-result";

    const wrapper = item.url
      ? document.createElement("a")
      : document.createElement("div");

    if (item.url) {
      wrapper.href = item.url;
      wrapper.target = "_blank";
      wrapper.className = "search-tool-result-link";
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
    maxLen: number
  ) {
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

    const adjustedIndices =
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

  function closeModal(modal: HTMLElement, overlay: HTMLElement) {
    modal.remove();
    overlay.remove();
  }
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
