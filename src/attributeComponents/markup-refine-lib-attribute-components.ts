import { initSideTopTopNavigation } from "./sideTopTopNavigation/sideTopTopNavigation";
import "./sideTopTopNavigation/sideTopTopNavigation.css";

import { initCopyableSnippet } from "./copyableSnippet/copyableSnippet";
import "./copyableSnippet/copyableSnippet.css";

import "./clickableItemList/clickableItemList.css"

document.addEventListener("DOMContentLoaded", () => {
  initSideTopTopNavigation();
  initCopyableSnippet();
});
