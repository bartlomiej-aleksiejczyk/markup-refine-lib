import { initClickableItemList } from "./components/clickableItemList/clickableItemList";
import { initCopyableSnippet } from "./components/copyableSnippet/copyableSnippet";
import { initSearchTool } from "./components/searchTool/searchTool";
import { initSideTopTopNavigation } from "./components/sideTopTopNavigation/sideTopTopNavigation";
import { initNavbarComponents } from "./components/navbarComponents/navbarComponents";
import {initResettableFileInput} from "./components/resettableFileInput/resettableFileInput"

document.addEventListener("DOMContentLoaded", () => {
  initClickableItemList();
  initSideTopTopNavigation();
  initSearchTool();
  initCopyableSnippet();
  initNavbarComponents();
  initResettableFileInput();
});
