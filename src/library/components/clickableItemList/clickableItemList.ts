export function initClickableItemList() {
  handleFilters();
  handleAutoSelector();
}

function handleFilters() {
  const filters = document.querySelectorAll(
    "input[data-clickable-item-list-filter]"
  );

  filters.forEach((input) => {
    const list =
      input.parentElement.querySelector(".clickable-item-list") ||
      input.nextElementSibling;

    if (!list || !list.classList.contains("clickable-item-list")) {
      console.warn("No clickable-item-list found near filter input");
      return;
    }

    input.addEventListener("input", () => {
      const filterText = input.value.trim().toLowerCase();

      const allLis = [];
      const stack = [];
      stack.push({ ul: list, parentLi: null });

      while (stack.length) {
        const { ul, parentLi } = stack.pop();
        const lis = Array.from(ul.children).filter((el) => el.tagName === "LI");

        for (const li of lis) {
          allLis.push({ li, parentLi });
          const nestedUL = li.querySelector(":scope > ul");
          if (nestedUL) stack.push({ ul: nestedUL, parentLi: li });
        }
      }

      for (const entry of allLis) {
        const text = entry.li.textContent.toLowerCase();
        entry.selfMatches = filterText === "" || text.includes(filterText);
        entry.childrenMatch = false;
      }

      for (let i = allLis.length - 1; i >= 0; i--) {
        const entry = allLis[i];
        const li = entry.li;
        const nestedUL = li.querySelector(":scope > ul");

        if (nestedUL) {
          const immediateChildren = Array.from(nestedUL.children).filter(
            (el) => el.tagName === "LI"
          );
          entry.childrenMatch = immediateChildren.some((childLi) => {
            const childEntry = allLis.find((e) => e.li === childLi);
            return (
              childEntry && (childEntry.selfMatches || childEntry.childrenMatch)
            );
          });
        }

        if (entry.parentLi) {
          const parentEntry = allLis.find((e) => e.li === entry.parentLi);
          if (parentEntry && (entry.selfMatches || entry.childrenMatch)) {
            parentEntry.childrenMatch = true;
          }
        }
      }

      for (const entry of allLis) {
        const li = entry.li;
        const nestedUL = li.querySelector(":scope > ul");
        const details = li.querySelector("details");

        const show = entry.selfMatches || entry.childrenMatch;
        li.style.display = show ? "" : "none";

        if (details) {
          if (show) {
            details.open = true;
          } else {
            details.open = false;
          }
        }

        if (entry.selfMatches && nestedUL) {
          const immediateChildren = Array.from(nestedUL.children).filter(
            (el) => el.tagName === "LI"
          );
          immediateChildren.forEach((childLi) => {
            childLi.style.display = "";
          });
        }
      }
    });
  });
}

export function handleAutoSelector() {
  const currentUrl = window.location.origin + window.location.pathname;

  const lists = document.querySelectorAll(
    "ul[data-clickable-item-list-autoselector]"
  );

  lists.forEach((list) => {
    const anchors = list.querySelectorAll("a[href]");

    anchors.forEach((a) => {
      const linkUrl = new URL(
        a.getAttribute("href"),
        window.location.origin + window.location.pathname
      ).href;

      const normalizedCurrent = currentUrl.endsWith("/")
        ? currentUrl.slice(0, -1)
        : currentUrl;
      const normalizedLink = linkUrl.endsWith("/")
        ? linkUrl.slice(0, -1)
        : linkUrl;

      if (normalizedCurrent === normalizedLink) {
        const li = a.closest("li");
        if (li && list.contains(li)) {
          li.classList.add("selected");
        }
      }
    });
  });
}
