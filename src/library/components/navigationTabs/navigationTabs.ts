export function initNavigationTabs() {
  document.querySelectorAll("[data-tabs-button-name]").forEach((button) => {
    button.addEventListener("click", handleSwitchTab);
  });
  document.querySelectorAll("[data-tabs-name]").forEach((tab) => {
    const defaultTabName = tab.getAttribute("data-tabs-default");
    if (defaultTabName) {
      tab.style.display = "none";
      const button = document.querySelector(
        `[data-tabs-button-name="${defaultTabName}"]`,
      );
      button?.setAttribute("data-tabs-button-active", "");
    }
  });

  function handleSwitchTab(e) {
    const tabName = e.currentTarget.getAttribute("data-tabs-button-name");
    if (!tabName) return;

    const tabGroup = e.currentTarget.getAttribute("data-tabs-group");
    if (!tabGroup) return;

    const tabs = document.querySelectorAll(
      `[data-tabs-group="${tabGroup}"][data-tabs-name]`,
    );
    if (!tabs) return;

    tabs.forEach((tab) => {
      if (tab.getAttribute("data-tabs-name") === tabName) {
        tab.style.display = "";
      } else {
        tab.style.display = "none";
      }
    });

    const buttons = document.querySelectorAll(
      `[data-tabs-group="${tabGroup}"][data-tabs-button-name]`,
    );
    buttons.forEach((button) => {
      if (button.getAttribute("data-tabs-button-name") === tabName) {
        button?.setAttribute("data-tabs-button-active", "");
      } else {
        button?.removeAttribute("data-tabs-button-active");
      }
    });
  }
}
