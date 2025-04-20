export function initCopyableSnippet() {
  // Add copy buttons
  document.querySelectorAll("[data-copyable-snippet]").forEach((pre) => {
    const code = pre.querySelector("code");
    if (code && !pre.querySelector(".copyable-snippet-button")) {
      const btn = document.createElement("button");
      btn.className = "copyable-snippet-button";
      btn.setAttribute("aria-label", "Copy");
      btn.textContent = "📋";
      code.appendChild(btn);
    }
  });

  // Handle button click
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".copyable-snippet-button");
    if (!btn) return;

    const pre = btn.closest("[data-copyable-snippet]");
    if (!pre) return;

    const code = pre.querySelector("code");
    if (!code) return;

    const text = code.firstChild?.nodeValue.trim();
    if (!text) return;

    const original = btn.textContent;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          btn.textContent = "✅";
          setTimeout(() => (btn.textContent = original), 1000);
        })
        .catch(() => fallbackCopy(text, btn, original));
    } else {
      fallbackCopy(text, btn, original);
    }
  });

  function fallbackCopy(text, btn, original) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        btn.textContent = "✅";
      } else {
        btn.textContent = "❌";
      }
    } catch (err) {
      console.warn("Fallback copy failed:", err);
      btn.textContent = "❌";
    }

    document.body.removeChild(textarea);
    setTimeout(() => (btn.textContent = original), 1000);
  }
}
