export function sideTopTopNavigation() {
  const root = document.querySelector(
    '[data-mdl-component="side-top-top-navigation"]'
  );
  if (!root) return;

  const drawerToggle = root.querySelector("#sidebar-toggle");
  const dismissButton = root.querySelector("#dismiss-button");
  const sidebar = root.querySelector(".primary-sidebar");
  const overlay = root.querySelector(".overlay");

  if (drawerToggle && sidebar && overlay) {
    drawerToggle.addEventListener("click", () => {
      sidebar.classList.toggle("drawer-open");
      overlay.classList.add("visible");
      document.body.style.overflowY = "hidden";
    });
  }

  if (dismissButton && sidebar && overlay) {
    dismissButton.addEventListener("click", () => {
      sidebar.classList.remove("drawer-open");
      overlay.classList.remove("visible");
      document.body.style.overflowY = "visible";
    });
  }

  if (overlay && sidebar) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("drawer-open");
      overlay.classList.remove("visible");
      document.body.style.overflowY = "visible";
    });
  }
}
