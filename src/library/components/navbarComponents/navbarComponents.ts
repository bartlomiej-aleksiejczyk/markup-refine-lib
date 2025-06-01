export function initNavbarComponents() {
  handleAutoSelector();
}
export function handleAutoSelector() {
  const currentUrl = window.location.origin + window.location.pathname;

  const lists = document.querySelectorAll(
    "nav.navigation-tabs[data-navigation-tabs-autoselector]"
  );

  lists.forEach((list) => {
    const anchors = list.querySelectorAll("a[href]");
    let numberOfSelectedItems = 0;

    anchors.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;

      const linkUrl = new URL(
        href,
        window.location.origin + window.location.pathname
      ).href;

      const normalizedCurrent = currentUrl.endsWith("/")
        ? currentUrl.slice(0, -1)
        : currentUrl;
      const normalizedLink = linkUrl.endsWith("/")
        ? linkUrl.slice(0, -1)
        : linkUrl;

      if (normalizedCurrent === normalizedLink) {
        numberOfSelectedItems++;
        a.classList.add("navigation-tabs--selected");
      }
      if (numberOfSelectedItems>1){
        anchors.forEach((a) => a.classList.remove("navigation-tabs--selected"))
        return;
      }
    });
  });
}
