import { initSideTopTopNavigation } from "./sideTopTopNavigation/sideTopTopNavigation";
import "../components/sideTopTopNavigation/sideTopTopNavigation.css";

import { initCopyableSnippet } from "./copyableSnippet/copyableSnippet";
import "../components/copyableSnippet/copyableSnippet.css";

import "../components/clickableItemList/clickableItemList.css"

document.addEventListener("DOMContentLoaded", () => {
  initSideTopTopNavigation();
  initCopyableSnippet();
});
