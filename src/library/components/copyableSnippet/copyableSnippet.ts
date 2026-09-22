export function initCopyableSnippet(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-mr-copyable]").forEach((pre) => {
    if (pre.dataset.mrCopyableInitialized === "true") return;

    const code = pre.querySelector("code");
    if (!code) return;

    pre.dataset.mrCopyableInitialized = "true";
    if (pre.querySelector("[data-mr-copy-action]")) return;

    const button = document.createElement("button");
    button.className = "mr-copy-button";
    button.setAttribute("data-mr-copy-action", "");
    button.setAttribute("aria-label", "Copy code");
    button.type = "button";
    button.textContent = "📋";
    pre.appendChild(button);
    button.addEventListener("click", () => copySnippet(pre, button));
  });
}

async function copySnippet(pre: HTMLElement, button: HTMLButtonElement) {
  const code = pre.querySelector("code");
  const text = code?.textContent;
  if (!text) return;

  const originalText = button.textContent;
  const originalLabel = button.getAttribute("aria-label") ?? "Copy code";

  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(text);
    showCopyResult(button, true, originalText, originalLabel);
  } catch {
    showCopyResult(button, fallbackCopy(text), originalText, originalLabel);
  }
}

function fallbackCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch (error) {
    console.warn("Fallback copy failed:", error);
    return false;
  } finally {
    textarea.remove();
  }
}

function showCopyResult(
  button: HTMLButtonElement,
  success: boolean,
  originalText: string | null,
  originalLabel: string,
) {
  button.disabled = true;
  button.textContent = success ? "✅" : "❌";
  button.setAttribute("aria-label", success ? "Copied" : "Copy failed");

  window.setTimeout(() => {
    button.textContent = originalText;
    button.setAttribute("aria-label", originalLabel);
    button.disabled = false;
  }, 1000);
}
