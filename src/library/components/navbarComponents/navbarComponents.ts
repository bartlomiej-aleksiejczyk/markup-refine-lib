export function initNavbarComponents(root: ParentNode = document) {
  handleAutoSelector(root);
}

export function handleAutoSelector(root: ParentNode = document) {
  const currentUrl = normalizeUrl(window.location.href);

  root.querySelectorAll<HTMLElement>("[data-mr-nav-tabs-autoselect]").forEach((list) => {
    if (list.dataset.mrNavAutoselectInitialized === "true") return;
    list.dataset.mrNavAutoselectInitialized = "true";

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
