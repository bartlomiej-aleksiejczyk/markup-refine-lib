import { initMarkupRefineBehaviors } from "./behaviors/initMarkupRefineBehaviors";

export { initMarkupRefineBehaviors };

function initializeDocument() {
  initMarkupRefineBehaviors(document);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDocument, { once: true });
  } else {
    initializeDocument();
  }
}
