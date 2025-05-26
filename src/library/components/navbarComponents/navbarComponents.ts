export function initNavbarComponents() {
  handleAutoSelector();
}
export function handleAutoSelector() {
  const currentUrl = window.location.origin + window.location.pathname;

  const lists = document.querySelectorAll("nav.navigation-tabs");

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
        a.classList.add("navigation-tabs--selected");
      }
    });
  });
}
