const TAB_INITIALIZED = "mrTabInitialized";

export function initNavigationTabs(root: ParentNode = document) {
  const buttons = Array.from(root.querySelectorAll<HTMLElement>("[data-mr-tab]"));
  const groups = new Set(buttons.map(getGroupKey));

  for (const group of groups) initializeGroup(root, group);
}

function initializeGroup(root: ParentNode, group: string) {
  const buttons = getGroupButtons(root, group);
  const panels = getGroupPanels(root, group);
  if (!buttons.length || !panels.length) return;

  buttons.forEach((button, index) => {
    configureTab(button, panels, group, index);
    if (button.dataset[TAB_INITIALIZED] !== "true") {
      button.dataset[TAB_INITIALIZED] = "true";
      button.addEventListener("click", () => activateTab(root, group, button));
      button.addEventListener("keydown", (event) => handleTabKeydown(event, root, group, button));
    }
  });

  panels.forEach((panel, index) => configurePanel(panel, buttons, group, index));

  const selected = buttons.find((button) => button.getAttribute("aria-selected") === "true");
  const authoredDefault = panels.find((panel) => panel.hasAttribute("data-mr-tabs-default"));
  const defaultButton = authoredDefault
    ? buttons.find((button) => getTabName(button) === getPanelName(authoredDefault))
    : null;

  activateTab(root, group, selected ?? defaultButton ?? buttons[0], false);
}

function configureTab(
  button: HTMLElement,
  panels: HTMLElement[],
  group: string,
  index: number,
) {
  const name = getTabName(button);
  if (!name) return;

  button.setAttribute("role", "tab");
  if (button instanceof HTMLButtonElement && !button.hasAttribute("type")) button.type = "button";

  const panel = panels.find((candidate) => getPanelName(candidate) === name);
  if (!panel) return;

  if (!button.id) button.id = makeId("mr-tab", group, name, index);
  if (!panel.id) panel.id = makeId("mr-panel", group, name, index);
  button.setAttribute("aria-controls", panel.id);
}

function configurePanel(
  panel: HTMLElement,
  buttons: HTMLElement[],
  group: string,
  index: number,
) {
  const name = getPanelName(panel);
  if (!name) return;

  panel.setAttribute("role", "tabpanel");
  const button = buttons.find((candidate) => getTabName(candidate) === name);
  if (!button) return;

  if (!button.id) button.id = makeId("mr-tab", group, name, index);
  if (!panel.id) panel.id = makeId("mr-panel", group, name, index);
  panel.setAttribute("aria-labelledby", button.id);
}

function activateTab(
  root: ParentNode,
  group: string,
  activeButton: HTMLElement,
  moveFocus = false,
) {
  const activeName = getTabName(activeButton);
  if (!activeName) return;

  const buttons = getGroupButtons(root, group);
  const panels = getGroupPanels(root, group);

  buttons.forEach((button) => {
    const selected = button === activeButton;
    button.setAttribute("aria-selected", selected ? "true" : "false");
    button.tabIndex = selected ? 0 : -1;
  });

  panels.forEach((panel) => {
    panel.hidden = getPanelName(panel) !== activeName;
  });

  if (moveFocus) activeButton.focus();
}

function handleTabKeydown(
  event: KeyboardEvent,
  root: ParentNode,
  group: string,
  current: HTMLElement,
) {
  const buttons = getGroupButtons(root, group);
  const index = buttons.indexOf(current);
  if (index < 0) return;

  let nextIndex: number | null = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    nextIndex = (index + 1) % buttons.length;
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    nextIndex = (index - 1 + buttons.length) % buttons.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = buttons.length - 1;
  }

  if (nextIndex === null) return;
  event.preventDefault();
  activateTab(root, group, buttons[nextIndex], true);
}

function getGroupButtons(root: ParentNode, group: string) {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-mr-tab]")).filter(
    (button) => getGroupKey(button) === group,
  );
}

function getGroupPanels(root: ParentNode, group: string) {
  return Array.from(root.querySelectorAll<HTMLElement>("[data-mr-panel]")).filter(
    (panel) => getGroupKey(panel) === group,
  );
}

function getTabName(element: Element) {
  return element.getAttribute("data-mr-tab");
}

function getPanelName(element: Element) {
  return element.getAttribute("data-mr-panel");
}

function getGroupKey(element: Element) {
  return element.getAttribute("data-mr-tabs-group") || "__default";
}

function makeId(prefix: string, group: string, name: string, index: number) {
  const safe = `${group}-${name}`.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${prefix}-${safe || index}`;
}
