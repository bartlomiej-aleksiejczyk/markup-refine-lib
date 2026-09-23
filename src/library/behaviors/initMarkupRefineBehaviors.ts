import { initLayers } from "../layers/manager";
import { initTooltips } from "../tooltips/manager";
import { initClickableItemList } from "../components/clickableItemList/clickableItemList";
import { initCopyableSnippet } from "../components/copyableSnippet/copyableSnippet";
import { initSearchTool } from "../components/searchTool/searchTool";
import { initApplicationShell } from "../components/applicationShell/applicationShell";
import { initNavbarComponents } from "../components/navbarComponents/navbarComponents";
import { initResettableFileInput } from "../components/resettableFileInput/resettableFileInput";
import { initNavigationTabs } from "../components/navigationTabs/navigationTabs";

/** Initialize Markup Refine data-mr-* progressive enhancements. */
export function initMarkupRefineBehaviors(root?: ParentNode) {
  const target = root ?? (typeof document !== "undefined" ? document : null);
  if (!target) return;

  initLayers(target);
  initTooltips(target);
  initClickableItemList(target);
  initApplicationShell(target);
  initSearchTool(target);
  initCopyableSnippet(target);
  initNavbarComponents(target);
  initResettableFileInput(target);
  initNavigationTabs(target);
}
