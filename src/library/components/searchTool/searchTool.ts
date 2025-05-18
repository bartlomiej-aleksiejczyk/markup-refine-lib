export function initSearchTool() {
  const triggers = document.querySelectorAll("[data-search-tool]");
  for (const btn of triggers) {
    btn.addEventListener("click", async () => {
      const mode = btn.getAttribute("data-mode");
      const staticUrl = btn.getAttribute("data-static-url");
      const dynamicUrl = btn.getAttribute("data-dynamic-url");

      const { overlay, modal, input, results, spinner, message, dismissBtn } =
        createSearchModalElements();
      document.body.appendChild(overlay);
      document.body.appendChild(modal);
      input.focus();

      let dataset = [];

      if (mode === "static") {
        spinner.style.display = "block";
        try {
          const res = await fetch(staticUrl);
          dataset = await res.json();
        } catch (err) {
          message.textContent = "⚠️ Failed to load search data.";
          console.error("Static fetch failed:", err);
        } finally {
          spinner.style.display = "none";
        }
      }

      input.oninput = async function () {
        const query = input.value.trim().toLowerCase();
        results.innerHTML = "";
        message.textContent = "";
        spinner.style.display = "block";

        if (!query) {
          spinner.style.display = "none";
          return;
        }

        if (mode === "static") {
          const filtered = dataset.filter((item) =>
            item.name.toLowerCase().includes(query)
          );
          filtered.forEach((item) => appendResult(results, item.name));
          if (filtered.length === 0) {
            message.textContent = "No results found.";
          }
          spinner.style.display = "none";
        } else if (mode === "dynamic") {
          try {
            const res = await fetch(dynamicUrl + encodeURIComponent(query));
            const dynamicResults = await res.json();
            if (dynamicResults.length === 0) {
              message.textContent = "No results found.";
            } else {
              dynamicResults.forEach((item) =>
                appendResult(results, item.name)
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

    const results = document.createElement("ul");
    results.className = "search-tool-results";

    modal.appendChild(dismissBtn);
    modal.appendChild(input);
    modal.appendChild(spinner);
    modal.appendChild(message);
    modal.appendChild(results);

    return { overlay, modal, input, results, spinner, message, dismissBtn };
  }

  function appendResult(container, text) {
    const li = document.createElement("li");
    li.className = "search-tool-result";
    li.textContent = text;
    container.appendChild(li);
  }

  function closeModal(modal, overlay) {
    modal.remove();
    overlay.remove();
  }
}
