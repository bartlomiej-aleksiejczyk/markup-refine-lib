export function initApplicationShell(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-mr-shell]").forEach((shell, index) => {
    if (shell.dataset.mrShellInitialized === "true") return;

    const toggle = shell.querySelector<HTMLButtonElement>('[data-mr-shell-action="toggle"]');
    const dismiss = shell.querySelector<HTMLButtonElement>('[data-mr-shell-action="dismiss"]');
    const sidebar = shell.querySelector<HTMLElement>('[data-mr-shell-part="sidebar"]');
    const overlay = shell.querySelector<HTMLElement>('[data-mr-shell-part="overlay"]');
    if (!sidebar || !overlay) return;

    shell.dataset.mrShellInitialized = "true";
    shell.dataset.mrState = "closed";
    overlay.hidden = true;

    if (!sidebar.id) sidebar.id = `mr-shell-sidebar-${index + 1}`;
    if (toggle) {
      toggle.type = "button";
      toggle.setAttribute("aria-controls", sidebar.id);
      toggle.setAttribute("aria-expanded", "false");
    }
    if (dismiss) {
      dismiss.type = "button";
      if (!dismiss.hasAttribute("aria-label")) dismiss.setAttribute("aria-label", "Close navigation");
    }

    const openSidebar = () => {
      shell.dataset.mrState = "open";
      overlay.hidden = false;
      toggle?.setAttribute("aria-expanded", "true");
      dismiss?.focus();
      document.addEventListener("keydown", handleEscape);
    };

    const closeSidebar = (restoreFocus = true) => {
      shell.dataset.mrState = "closed";
      overlay.hidden = true;
      toggle?.setAttribute("aria-expanded", "false");
      document.removeEventListener("keydown", handleEscape);
      if (restoreFocus) toggle?.focus();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSidebar();
    };

    toggle?.addEventListener("click", openSidebar);
    dismiss?.addEventListener("click", () => closeSidebar());
    overlay.addEventListener("click", () => closeSidebar());
  });
}
