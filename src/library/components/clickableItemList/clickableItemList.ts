type ClickableListEntry = {
  li: HTMLLIElement;
  parentLi: HTMLLIElement | null;
  selfMatches?: boolean;
  childrenMatch?: boolean;
};

const suppressedPersistence = new WeakSet<HTMLDetailsElement>();

export function initClickableItemList(root: ParentNode = document) {
  handlePersistence(root);
  handleFilters(root);
  handleAutoSelector(root);
}

function handlePersistence(root: ParentNode) {
  root.querySelectorAll<HTMLUListElement>("ul[data-mr-clickable-list-persist]").forEach((list) => {
    if (list.dataset.mrClickablePersistInitialized === "true") return;

    const persistenceKey = list.dataset.mrClickableListPersist?.trim();
    if (!persistenceKey) return;

    list.dataset.mrClickablePersistInitialized = "true";

    const storage = getLocalStorage(list);
    if (!storage) return;

    const details = Array.from(list.querySelectorAll<HTMLDetailsElement>("details"));
    const persistableDetails = details.filter((detail) => {
      if (detail.id) return true;
      console.warn(
        "Markup Refine clickable-list persistence ignores <details> without a stable id",
        detail,
      );
      return false;
    });

    const storageKey = `markup-refine:clickable-list:${persistenceKey}`;
    const storedOpenIds = readOpenDetailIds(storage, storageKey);

    if (storedOpenIds) {
      const openIds = new Set(storedOpenIds);
      persistableDetails.forEach((detail) => {
        detail.open = openIds.has(detail.id);
      });
    }

    const persist = () => {
      const openIds = persistableDetails.filter((detail) => detail.open).map((detail) => detail.id);
      try {
        storage.setItem(storageKey, JSON.stringify(openIds));
      } catch {
        // Storage can become unavailable at runtime (privacy policy, quota, sandboxing).
        // The authored <details open> state remains the graceful fallback.
      }
    };

    persistableDetails.forEach((detail) => {
      detail.addEventListener("toggle", () => {
        if (suppressedPersistence.delete(detail)) return;
        persist();
      });
    });
  });
}

function getLocalStorage(list: HTMLUListElement) {
  try {
    return list.ownerDocument.defaultView?.localStorage ?? null;
  } catch {
    return null;
  }
}

function readOpenDetailIds(storage: Storage, storageKey: string): string[] | null {
  try {
    const raw = storage.getItem(storageKey);
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some((value) => typeof value !== "string")) return null;
    return parsed as string[];
  } catch {
    return null;
  }
}

function setDetailsOpenWithoutPersisting(details: HTMLDetailsElement, open: boolean) {
  if (details.open === open) return;
  suppressedPersistence.add(details);
  details.open = open;
}

function handleFilters(root: ParentNode) {
  root.querySelectorAll<HTMLInputElement>("input[data-mr-clickable-list-filter]").forEach((input) => {
    if (input.dataset.mrClickableFilterInitialized === "true") return;
    const nearbyList =
      input.parentElement?.querySelector<HTMLElement>(".mr-clickable-list") ||
      (input.nextElementSibling instanceof HTMLElement &&
      input.nextElementSibling.matches(".mr-clickable-list")
        ? input.nextElementSibling
        : null);

    if (!nearbyList) {
      console.warn("No Markup Refine clickable list found near filter input");
      return;
    }

    input.dataset.mrClickableFilterInitialized = "true";
    input.addEventListener("input", () => filterList(nearbyList, input.value));
  });
}

function filterList(list: HTMLElement, rawFilter: string) {
  const filterText = rawFilter.trim().toLowerCase();
  const allLis: ClickableListEntry[] = [];
  const stack: Array<{ ul: HTMLElement; parentLi: HTMLLIElement | null }> = [
    { ul: list, parentLi: null },
  ];

  while (stack.length) {
    const current = stack.pop();
    if (!current) break;

    const { ul, parentLi } = current;
    const lis = Array.from(ul.children).filter(
      (element): element is HTMLLIElement => element instanceof HTMLLIElement,
    );

    for (const li of lis) {
      allLis.push({ li, parentLi });
      const nestedList = li.querySelector<HTMLUListElement>(":scope > ul");
      if (nestedList) stack.push({ ul: nestedList, parentLi: li });
    }
  }

  for (const entry of allLis) {
    const text = (entry.li.textContent ?? "").toLowerCase();
    entry.selfMatches = filterText === "" || text.includes(filterText);
    entry.childrenMatch = false;
  }

  for (let index = allLis.length - 1; index >= 0; index--) {
    const entry = allLis[index];
    const nestedList = entry.li.querySelector<HTMLUListElement>(":scope > ul");

    if (nestedList) {
      const immediateChildren = Array.from(nestedList.children).filter(
        (element): element is HTMLLIElement => element instanceof HTMLLIElement,
      );
      entry.childrenMatch = immediateChildren.some((childLi) => {
        const childEntry = allLis.find((candidate) => candidate.li === childLi);
        return Boolean(childEntry && (childEntry.selfMatches || childEntry.childrenMatch));
      });
    }

    if (entry.parentLi) {
      const parentEntry = allLis.find((candidate) => candidate.li === entry.parentLi);
      if (parentEntry && (entry.selfMatches || entry.childrenMatch)) {
        parentEntry.childrenMatch = true;
      }
    }
  }

  for (const entry of allLis) {
    const nestedList = entry.li.querySelector<HTMLUListElement>(":scope > ul");
    const details = entry.li.querySelector<HTMLDetailsElement>("details");
    const show = Boolean(entry.selfMatches || entry.childrenMatch);

    entry.li.hidden = !show;
    if (details && filterText) setDetailsOpenWithoutPersisting(details, show);

    if (entry.selfMatches && nestedList) {
      Array.from(nestedList.children)
        .filter((element): element is HTMLLIElement => element instanceof HTMLLIElement)
        .forEach((childLi) => {
          childLi.hidden = false;
        });
    }
  }
}

export function handleAutoSelector(root: ParentNode = document) {
  const currentUrl = normalizeUrl(window.location.href);

  root.querySelectorAll<HTMLUListElement>("ul[data-mr-clickable-list-autoselect]").forEach((list) => {
    if (list.dataset.mrClickableAutoselectInitialized === "true") return;
    list.dataset.mrClickableAutoselectInitialized = "true";

    const anchors = Array.from(list.querySelectorAll<HTMLAnchorElement>("a[href]"));
    const matching = anchors.filter((anchor) => normalizeUrl(anchor.href) === currentUrl);

    anchors.forEach((anchor) => anchor.removeAttribute("aria-current"));
    if (matching.length === 1) matching[0].setAttribute("aria-current", "page");
  });
}

function normalizeUrl(url: string) {
  const parsed = new URL(url, window.location.href);
  const pathname = parsed.pathname.length > 1 ? parsed.pathname.replace(/\/$/, "") : parsed.pathname;
  return `${parsed.origin}${pathname}`;
}
