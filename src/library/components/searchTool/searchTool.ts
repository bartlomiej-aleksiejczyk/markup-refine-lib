import Fuse from "fuse.js";
import { searchInDataset } from "./searchInDataset";

export function initSearchTool() {
  const triggers = document.querySelectorAll("[data-search-tool]");
  let isLoadingFailed = false;
  for (const btn of triggers) {
    btn.addEventListener("click", async () => {
      const mode = btn.getAttribute("data-mode");
      const staticUrl = btn.getAttribute("data-static-url");
      const dynamicUrl = btn.getAttribute("data-dynamic-url");

      const {
        overlay,
        modal,
        input,
        results,
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

      let fuse = null;
      let dataset = null;

      if (mode === "static") {
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
        }
      }

      input.oninput = async function () {
        const query = input.value.trim();
        results.innerHTML = "";
        if (isLoadingFailed !== true) {
          message.textContent = "";
          message.style.display = "none";
          spinner.style.display = "block";
        }

        if (!query) {
          message.style.display = "none";
          spinner.style.display = "none";
          resultCount.textContent = "";
          resultCount.style.display = "none";
          return;
        }

        if (mode === "static" && fuse) {
          const searchResults = fuse.search(query);
          if (searchResults.length === 0) {
            message.style.display = "block";
            message.textContent = "No results found.";
            resultCount.textContent = "";
            resultCount.style.display = "none";
          } else {
            message.style.display = "none";
            resultCount.style.display = "block";

            resultCount.textContent = `🔎 Found ${searchResults.length} result(s).`;
            searchResults.forEach((result) => {
              appendResult(results, result.item, result.matches, result.score);
            });
          }
          spinner.style.display = "none";
        }

        if (mode === "dynamic") {
          try {
            const res = await fetch(dynamicUrl + encodeURIComponent(query));
            const dynamicResults = await res.json();
            if (dynamicResults.length === 0) {
              message.textContent = "No results found.";
              resultCount.textContent = "";
            } else {
              resultCount.textContent = `🔎 Found ${dynamicResults.length} result(s).`;
              dynamicResults.forEach((item) =>
                appendResult(results, item.title || item.name)
              );
            }
          } catch (err) {
            message.textContent = "⚠️ Failed to fetch results.";
            console.error("Dynamic fetch failed:", err);
          } finally {
            spinner.style.display = "none";
          }
        }
      };

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

    const spinner = document.createElement("div");
    spinner.className = "search-tool-spinner";
    spinner.textContent = "Loading...";
    spinner.style.display = "none";

    const message = document.createElement("div");
    message.className = "search-tool-message";

    const resultCount = document.createElement("div");
    resultCount.className = "search-tool-result-count";

    const results = document.createElement("ul");
    results.className = "search-tool-results";

    modal.appendChild(dismissBtn);
    modal.appendChild(input);
    modal.appendChild(spinner);
    modal.appendChild(message);
    modal.appendChild(resultCount);
    modal.appendChild(results);

    return {
      overlay,
      modal,
      input,
      results,
      spinner,
      message,
      dismissBtn,
      resultCount,
    };
  }

  function appendResult(container, item, matches = [], score = null) {
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

    const titleMatch = matches.find((m) => m.key === "title");
    const contentMatch = matches.find((m) => m.key === "content");
    const mergedTitleIndices = mergeRanges(titleMatch?.indices || []);

    renderHighlightedText(titleEl, item.title || "", mergedTitleIndices);

    const truncated = truncateToMatch(
      item.content || "",
      contentMatch?.indices || [],
      200
    );
    const mergedTruncatedTextIndices = mergeRanges(truncated.adjustedIndices);

    renderHighlightedText(
      contentEl,
      truncated.text,
      mergedTruncatedTextIndices
    );

    wrapper.appendChild(titleEl);
    wrapper.appendChild(contentEl);

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

  function truncateToMatch(text, indices, maxLen) {
    if (text.length <= maxLen || indices.length === 0) {
      return {
        text: text.slice(0, maxLen),
        adjustedIndices: indices.filter(([s, e]) => s < maxLen),
      };
    }

    // 🔥 Get the match with the longest length
    const [matchStart, matchEnd] = indices.reduce((longest, current) => {
      const [s1, e1] = longest;
      const [s2, e2] = current;
      return e2 - s2 > e1 - s1 ? current : longest;
    });

    const matchCenter = Math.floor((matchStart + matchEnd) / 2);
    const start = Math.max(0, matchCenter - Math.floor(maxLen / 2));
    const end = Math.min(text.length, start + maxLen);
    const sliced = text.slice(start, end);

    // Only keep the adjusted longest match
    const adjustedStart = matchStart - start;
    const adjustedEnd = matchEnd - start;

    const adjustedIndices =
      adjustedStart >= 0 && adjustedEnd < sliced.length
        ? [[adjustedStart, adjustedEnd]]
        : [];

    return { text: sliced, adjustedIndices };
  }

  function renderHighlightedText(parent, text, indices) {
    let lastIndex = 0;

    for (const [start, end] of indices) {
      if (end - start + 1 < 2) continue; // Skip 1-char matches

      // Append plain text before match
      if (lastIndex < start) {
        const span = document.createTextNode(text.slice(lastIndex, start));
        parent.appendChild(span);
      }

      // Append <mark> with matched text
      const mark = document.createElement("mark");
      mark.textContent = text.slice(start, end + 1);
      parent.appendChild(mark);

      lastIndex = end + 1;
    }

    // Append remaining text after last match
    if (lastIndex < text.length) {
      const span = document.createTextNode(text.slice(lastIndex));
      parent.appendChild(span);
    }
  }

  function closeModal(modal, overlay) {
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
