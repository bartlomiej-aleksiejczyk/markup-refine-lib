export function initNavigationTabs() {
  document.querySelectorAll("[data-tabs-button-name]").forEach((button) => {
    button.addEventListener("click", handleSwitchTab);
  });
  document.querySelectorAll("[data-tabs-name]").forEach((tab) => {
    if (tab.getAttribute("data-tabs-default") !== "") {
      tab.style.display = "none";
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
  }
}
