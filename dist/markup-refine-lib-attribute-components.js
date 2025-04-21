function i() {
  const a = document.querySelector(".stt-component");
  if (!a) return;
  const n = a.querySelector('[data-stt-action="toggle"]'), t = a.querySelector('[data-stt-action="dismiss"]'), o = a.querySelector('[data-stt-element="sidebar"]'), e = a.querySelector('[data-stt-element="overlay"]');
  function c() {
    o.classList.add("stt-drawer-open"), e.classList.add("stt-overlay-visible");
  }
  function s() {
    o.classList.remove("stt-drawer-open"), e.classList.remove("stt-overlay-visible");
  }
  n == null || n.addEventListener("click", c), t == null || t.addEventListener("click", s), e == null || e.addEventListener("click", s);
}
function r() {
  document.querySelectorAll("[data-copyable-snippet]").forEach((n) => {
    if (n.querySelector("code") && !n.querySelector(".copyable-snippet-button")) {
      const o = document.createElement("button");
      o.className = "copyable-snippet-button", o.setAttribute("aria-label", "Copy"), o.textContent = "📋", n.appendChild(o);
    }
  }), document.addEventListener("click", (n) => {
    const t = n.target.closest(".copyable-snippet-button");
    if (!t) return;
    const o = t.closest("[data-copyable-snippet]");
    if (!o) return;
    const e = o.querySelector("code");
    if (!e) return;
    const c = e.textContent;
    if (!c) return;
    const s = t.textContent;
    navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(c).then(() => {
      t.textContent = "✅", setTimeout(() => t.textContent = s, 1e3);
    }).catch(() => a(c, t, s)) : a(c, t, s);
  });
  function a(n, t, o) {
    const e = document.createElement("textarea");
    e.value = n, e.style.position = "fixed", e.style.opacity = "0", document.body.appendChild(e), e.select();
    try {
      document.execCommand("copy") ? t.textContent = "✅" : t.textContent = "❌";
    } catch (c) {
      console.warn("Fallback copy failed:", c), t.textContent = "❌";
    }
    document.body.removeChild(e), setTimeout(() => t.textContent = o, 1e3);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  i(), r();
});
