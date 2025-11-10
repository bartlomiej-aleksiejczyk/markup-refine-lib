export function initResettableFileInput() {
  document.querySelectorAll("[data-resettable-file-input]").forEach((container) => {
    const btn = document.createElement("button");
    btn.className = "resettable-file-input-button";
    btn.setAttribute("aria-label", "Remove all attachments");
    btn.type = "button";
    btn.title = "Click to remove all attachments"
    btn.textContent = "✖";

    container.className = "resettable-file-input-container";
    container.appendChild(btn);

    const input = container.querySelector("input");
    if (!input) return;

    btn.addEventListener("click", () => {
      input.value = ''; 
    });
  });
}
