import { layers } from "../../layers/manager";

export function initApplicationShell(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-mr-shell]").forEach((shell, index) => {
    if (shell.dataset.mrShellInitialized === "true") return;

    const toggle = shell.querySelector<HTMLButtonElement>('[data-mr-shell-action="toggle"]');
    const dismiss = shell.querySelector<HTMLButtonElement>('[data-mr-shell-action="dismiss"]');
    const sidebar = shell.querySelector<HTMLElement>('[data-mr-shell-part="sidebar"]');
    if (!sidebar) return;

    const drawer = createDrawerSurface(shell, sidebar, index);
    const layer = layers.get(drawer);
    if (!layer) {
      drawer.remove();
      return;
    }

    shell.dataset.mrShellInitialized = "true";

    if (toggle) {
      toggle.type = "button";
      toggle.setAttribute("aria-controls", drawer.id);
      toggle.setAttribute("aria-expanded", "false");
    }
    if (dismiss) {
      dismiss.type = "button";
      if (!dismiss.hasAttribute("aria-label")) dismiss.setAttribute("aria-label", "Close navigation");
    }

    let contentInDrawer = false;

    const moveNavigationToDrawer = () => {
      if (contentInDrawer) return;
      drawer.append(...Array.from(sidebar.childNodes));
      contentInDrawer = true;
    };

    const restoreNavigationToSidebar = () => {
      if (!contentInDrawer) return;
      sidebar.append(...Array.from(drawer.childNodes));
      contentInDrawer = false;
    };

    const openDrawer = async () => {
      moveNavigationToDrawer();
      await layer.open({ trigger: toggle ?? null });

      if (layer.state !== "open") {
        restoreNavigationToSidebar();
        return;
      }

      dismiss?.focus();
    };

    const closeDrawer = (restoreFocus = true) => {
      void layer.close({ restoreFocus });
    };

    drawer.addEventListener("mr:layer:open", () => {
      toggle?.setAttribute("aria-expanded", "true");
    });

    drawer.addEventListener("mr:layer:close", () => {
      toggle?.setAttribute("aria-expanded", "false");
      queueMicrotask(restoreNavigationToSidebar);
    });

    toggle?.addEventListener("click", () => {
      void openDrawer();
    });
    dismiss?.addEventListener("click", () => closeDrawer());

    const view = shell.ownerDocument.defaultView;
    view?.addEventListener("resize", () => {
      if (layer.state !== "open" || isToggleVisible(toggle, view)) return;
      closeDrawer(false);
    });
  });
}

function createDrawerSurface(
  shell: HTMLElement,
  sidebar: HTMLElement,
  index: number,
): HTMLDialogElement {
  const drawer = shell.ownerDocument.createElement("dialog");
  drawer.id = uniqueDrawerId(shell.ownerDocument, index + 1);
  drawer.className = "mr-layer mr-layer--drawer mr-shell__drawer";
  drawer.setAttribute("data-mr-layer", "drawer");
  drawer.setAttribute("data-mr-shell-part", "drawer");
  drawer.setAttribute("closedby", "any");

  const labelledBy = sidebar.getAttribute("aria-labelledby");
  const label = sidebar.getAttribute("aria-label");
  if (labelledBy) drawer.setAttribute("aria-labelledby", labelledBy);
  else drawer.setAttribute("aria-label", label || "Navigation");

  shell.appendChild(drawer);
  return drawer;
}

function uniqueDrawerId(document: Document, ordinal: number): string {
  const base = `mr-shell-drawer-${ordinal}`;
  if (!document.getElementById(base)) return base;

  let suffix = 2;
  while (document.getElementById(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function isToggleVisible(
  toggle: HTMLElement | null,
  view: Window,
): boolean {
  return Boolean(toggle && view.getComputedStyle(toggle).display !== "none");
}
