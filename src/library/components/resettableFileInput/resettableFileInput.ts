export function initResettableFileInput(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-mr-resettable-file]").forEach((container) => {
    if (container.dataset.mrResettableFileInitialized === "true") return;

    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) return;

    container.dataset.mrResettableFileInitialized = "true";
    container.classList.add("mr-file-input");

    if (container.querySelector("[data-mr-file-reset]")) return;

    const button = document.createElement("button");
    button.className = "mr-file-input__reset";
    button.setAttribute("data-mr-file-reset", "");
    button.setAttribute("aria-label", "Remove all attachments");
    button.type = "button";
    button.title = "Click to remove all attachments";
    button.textContent = "✖";

    container.appendChild(button);
    button.addEventListener("click", () => {
      input.value = "";
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.focus();
    });
  });
}
