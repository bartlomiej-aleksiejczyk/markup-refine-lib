export function initSideTopTopNavigation() {
  const root = document.querySelector(".stt-component");
  if (!root) return;

  const drawerToggle = root.querySelector('[data-stt-action="toggle"]');
  const dismissButton = root.querySelector('[data-stt-action="dismiss"]');
  const sidebar = root.querySelector('[data-stt-element="sidebar"]');
  const overlay = root.querySelector('[data-stt-element="overlay"]');

  function openSidebar() {
    sidebar.classList.add("stt-drawer-open");
    overlay.classList.add("stt-overlay-visible");
  }

  function closeSidebar() {
    sidebar.classList.remove("stt-drawer-open");
    overlay.classList.remove("stt-overlay-visible");
  }

  drawerToggle?.addEventListener("click", openSidebar);
  dismissButton?.addEventListener("click", closeSidebar);
  overlay?.addEventListener("click", closeSidebar);
}
