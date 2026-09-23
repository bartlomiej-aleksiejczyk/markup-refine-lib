import { layers } from "../layers/manager";
import type { Layer } from "../layers/types";
import type { Tooltip, TooltipOptions, TooltipState } from "./types";

export interface TooltipHost {
  readonly options: Readonly<TooltipOptions>;
  initialize(root: ParentNode): void;
  activatePreview(tooltip: TooltipController): void;
  deactivatePreview(tooltip: TooltipController): void;
  activatePinned(tooltip: TooltipController): void;
  deactivatePinned(tooltip: TooltipController): void;
}

const PREVIEW_RELATION = "aria-describedby";
const PINNED_RELATION = "aria-details";
const RELATION_ATTRIBUTES = Object.freeze([
  "aria-labelledby",
  "aria-describedby",
  "aria-details",
  "aria-controls",
  "aria-owns",
]);

let surfaceSequence = 0;
const tooltipSurfaceOwners = new WeakMap<HTMLElement, TooltipController>();

export class TooltipController implements Tooltip {
  readonly trigger: HTMLElement;

  private readonly host: TooltipHost;
  private readonly source: HTMLElement | HTMLTemplateElement;
  private currentState: TooltipState = "hidden";
  private previewSurface: HTMLElement | null = null;
  private pinnedSurface: HTMLElement | null = null;
  private pinnedLayer: Layer | null = null;
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private pinTimer: ReturnType<typeof setTimeout> | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    trigger: HTMLElement,
    source: HTMLElement | HTMLTemplateElement,
    host: TooltipHost,
  ) {
    this.trigger = trigger;
    this.source = source;
    this.host = host;

    this.trigger.addEventListener("pointerenter", this.handleTriggerEnter);
    this.trigger.addEventListener("pointerleave", this.handleTriggerPointerLeave);
    this.trigger.addEventListener("focusin", this.handleTriggerEnter);
    this.trigger.addEventListener("focusout", this.handleTriggerFocusOut);
  }

  get state(): TooltipState {
    return this.currentState;
  }

  show(): void {
    this.clearCloseTimer();
    if (this.currentState === "preview" || this.currentState === "pinned") return;
    if (this.currentState === "waiting") return;

    this.currentState = "waiting";
    const delay = this.host.options.showDelay;
    if (delay === 0) {
      this.showPreview();
      return;
    }

    this.showTimer = setTimeout(() => {
      this.showTimer = null;
      this.showPreview();
    }, delay);
  }

  hide(): void {
    this.clearShowTimer();
    this.clearPinTimer();

    if (this.currentState === "hidden") return;
    if (this.currentState === "waiting") {
      this.currentState = "hidden";
      return;
    }

    this.clearCloseTimer();
    const delay = this.host.options.closeDelay;
    if (delay === 0) {
      this.hideImmediately();
      return;
    }

    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      this.hideImmediately();
    }, delay);
  }

  pin(): void {
    this.clearTimers();
    if (this.currentState === "pinned") return;
    if (!supportsPopover(this.trigger.ownerDocument)) {
      this.currentState = "hidden";
      return;
    }

    if (this.previewSurface) {
      this.previewSurface.setAttribute("data-mr-tooltip-promoting", "");
      this.previewSurface.removeAttribute("data-mr-tooltip-pinning");
    }
    this.hidePreviewSurface();
    const surface = this.ensurePinnedSurface();
    const layer = layers.get(surface);
    if (!layer) {
      this.currentState = "hidden";
      return;
    }

    this.pinnedLayer = layer;
    this.currentState = "pinned";
    addRelationship(this.trigger, PINNED_RELATION, surface.id);

    void layer.open({ trigger: this.trigger }).then(() => {
      if (this.currentState !== "pinned") return;
      if (layer.state === "closed") {
        this.finishPinnedClose();
        return;
      }
      this.host.activatePinned(this);
    });
  }

  unpin(): void {
    this.dismissPinned(false);
  }

  /** @internal Used by the registry for deterministic global dismissal. */
  hideNow(): void {
    this.clearTimers();
    this.hideImmediately();
  }

  /** @internal Used by the registry for explicit outside/Escape dismissal. */
  dismissPinned(restoreFocus: boolean): void {
    this.clearTimers();
    if (this.currentState !== "pinned") {
      this.hideImmediately();
      return;
    }

    const layer = this.pinnedLayer;
    if (!layer || layer.state === "closed") {
      this.finishPinnedClose();
      return;
    }

    void layer.close({ restoreFocus });
  }

  /** @internal True when a pointer target belongs to this tooltip interaction tree. */
  ownsInteractionTarget(target: Node): boolean {
    return this.containsInteractionTarget(target);
  }

  private showPreview(): void {
    if (this.currentState !== "waiting") return;
    if (!supportsPopover(this.trigger.ownerDocument)) {
      this.currentState = "hidden";
      return;
    }

    const surface = this.ensurePreviewSurface();
    surface.removeAttribute("data-mr-tooltip-promoting");
    const showPopover = surface.showPopover as
      | ((options?: { source?: HTMLElement }) => void)
      | undefined;
    if (typeof showPopover !== "function") {
      this.currentState = "hidden";
      return;
    }

    this.currentState = "preview";
    addRelationship(this.trigger, PREVIEW_RELATION, surface.id);

    try {
      showPopover.call(surface, { source: this.trigger });
    } catch {
      removeRelationship(this.trigger, PREVIEW_RELATION, surface.id);
      this.currentState = "hidden";
      return;
    }

    this.host.activatePreview(this);

    const delay = this.host.options.pinDelay;
    if (delay === 0) {
      this.pin();
      return;
    }

    surface.style.setProperty("--mr-tooltip-pin-delay", `${delay}ms`);
    surface.setAttribute("data-mr-tooltip-pinning", "");

    this.pinTimer = setTimeout(() => {
      this.pinTimer = null;
      if (this.currentState === "preview") this.pin();
    }, delay);
  }

  private hideImmediately(): void {
    this.clearTimers();

    if (this.currentState === "pinned") {
      const layer = this.pinnedLayer;
      if (layer && layer.state !== "closed") {
        void layer.close({ restoreFocus: false });
        return;
      }
      this.finishPinnedClose();
      return;
    }

    this.hidePreviewSurface();
    this.currentState = "hidden";
  }

  private hidePreviewSurface(): void {
    const surface = this.previewSurface;
    if (!surface) return;

    surface.removeAttribute("data-mr-tooltip-pinning");
    this.host.deactivatePreview(this);
    removeRelationship(this.trigger, PREVIEW_RELATION, surface.id);
    if (isPopoverOpen(surface) && typeof surface.hidePopover === "function") {
      try {
        surface.hidePopover();
      } catch {
        // Native popover state may already have changed through light dismiss.
      }
    }
  }

  private finishPinnedClose(): void {
    this.host.deactivatePinned(this);
    if (this.pinnedSurface) {
      removeRelationship(this.trigger, PINNED_RELATION, this.pinnedSurface.id);
    }
    this.currentState = "hidden";
    this.clearTimers();
  }

  private ensurePreviewSurface(): HTMLElement {
    if (this.previewSurface) return this.previewSurface;

    const document = this.trigger.ownerDocument;
    const surface = document.createElement("div");
    surface.id = nextSurfaceId("preview");
    surface.className = "mr-tooltip mr-tooltip--preview";
    surface.setAttribute("popover", "hint");
    surface.setAttribute("role", "tooltip");
    surface.setAttribute("data-mr-tooltip-preview", "");

    const contents = cloneTooltipContents(this.source);
    const accessibleText = getPreviewAccessibleText(contents);
    preparePreviewContents(contents);
    if (accessibleText) surface.setAttribute("aria-label", accessibleText);
    surface.append(contents, createPinProgress(document));
    getSurfaceHost(this.trigger).append(surface);

    surface.addEventListener("pointerenter", this.handleSurfaceEnter);
    surface.addEventListener("pointerleave", this.handleSurfaceLeave);
    surface.addEventListener("toggle", this.handlePreviewToggle);
    tooltipSurfaceOwners.set(surface, this);
    this.previewSurface = surface;
    return surface;
  }

  private ensurePinnedSurface(): HTMLElement {
    if (this.pinnedSurface) return this.pinnedSurface;

    const document = this.trigger.ownerDocument;
    const surface = document.createElement("div");
    surface.id = nextSurfaceId("pinned");
    surface.className = "mr-layer mr-layer--popover mr-tooltip mr-tooltip--pinned";
    surface.setAttribute("popover", "manual");
    surface.setAttribute("data-mr-layer", "popover");
    surface.setAttribute("data-mr-tooltip-pinned", "");

    const dismissButton = document.createElement("button");
    dismissButton.type = "button";
    dismissButton.className = "mr-tooltip__dismiss";
    dismissButton.setAttribute("aria-label", "Dismiss tooltip");
    dismissButton.setAttribute("data-mr-tooltip-dismiss", "");
    dismissButton.textContent = "×";
    dismissButton.addEventListener("click", this.handleDismissClick);

    surface.append(cloneTooltipContents(this.source), dismissButton);
    getSurfaceHost(this.trigger).append(surface);

    surface.addEventListener("pointerenter", this.handleSurfaceEnter);
    surface.addEventListener("pointerleave", this.handleSurfaceLeave);
    surface.addEventListener("focusin", this.handleSurfaceEnter);
    surface.addEventListener("focusout", this.handleSurfaceLeave);
    surface.addEventListener("mr:layer:close", this.handlePinnedLayerClose);

    tooltipSurfaceOwners.set(surface, this);
    this.pinnedSurface = surface;
    this.host.initialize(surface);
    return surface;
  }

  private readonly handleTriggerEnter = (): void => {
    this.show();
  };

  private readonly handleTriggerPointerLeave = (): void => {
    if (this.currentState === "pinned") return;

    /*
     * Pointer previews belong to the invoking element until promotion. Leaving
     * the trigger cancels both a pending preview and a visible unpinned preview
     * immediately; users who want to interact with/select the surface wait for
     * the pinned state.
     */
    this.hideNow();
  };

  private readonly handleTriggerFocusOut = (event: Event): void => {
    if (this.currentState === "pinned") return;
    if (this.containsInteractionTarget(getRelatedTarget(event))) {
      this.clearCloseTimer();
      return;
    }
    this.hide();
  };

  private readonly handleSurfaceEnter = (): void => {
    this.clearCloseTimer();
  };

  private readonly handleSurfaceLeave = (event: Event): void => {
    if (this.currentState === "pinned") return;
    if (this.containsInteractionTarget(getRelatedTarget(event))) {
      this.clearCloseTimer();
      return;
    }
    this.hide();
  };

  private readonly handlePreviewToggle = (): void => {
    if (this.currentState !== "preview" || !this.previewSurface) return;
    if (isPopoverOpen(this.previewSurface)) return;

    removeRelationship(this.trigger, PREVIEW_RELATION, this.previewSurface.id);
    this.previewSurface.removeAttribute("data-mr-tooltip-pinning");
    this.host.deactivatePreview(this);
    this.clearPinTimer();
    this.currentState = "hidden";
  };

  private readonly handlePinnedLayerClose = (event: Event): void => {
    if (event.target !== this.pinnedSurface) return;
    this.finishPinnedClose();
  };

  private readonly handleDismissClick = (): void => {
    this.dismissPinned(true);
  };

  private containsInteractionTarget(target: Node | null): boolean {
    if (!target) return false;
    if (this.trigger === target || this.trigger.contains(target)) return true;
    if (this.previewSurface?.contains(target)) return true;
    if (this.pinnedSurface?.contains(target)) return true;
    if (this.containsNestedTooltipSurface(target)) return true;

    const ownLayer = this.pinnedLayer;
    if (!ownLayer) return false;

    let candidate = layers.closest(target);
    while (candidate) {
      if (candidate === ownLayer) return true;
      candidate = candidate.parent;
    }
    return false;
  }

  private containsNestedTooltipSurface(target: Node): boolean {
    const nestedTooltip = findTooltipSurfaceOwner(target);
    if (!nestedTooltip || nestedTooltip === this) return false;

    if (this.pinnedSurface?.contains(nestedTooltip.trigger)) return true;

    const ownLayer = this.pinnedLayer;
    if (!ownLayer) return false;

    let triggerLayer = layers.closest(nestedTooltip.trigger);
    while (triggerLayer) {
      if (triggerLayer === ownLayer) return true;
      triggerLayer = triggerLayer.parent;
    }

    return false;
  }

  private clearTimers(): void {
    this.clearShowTimer();
    this.clearPinTimer();
    this.clearCloseTimer();
  }

  private clearShowTimer(): void {
    if (this.showTimer === null) return;
    clearTimeout(this.showTimer);
    this.showTimer = null;
  }

  private clearPinTimer(): void {
    if (this.pinTimer === null) return;
    clearTimeout(this.pinTimer);
    this.pinTimer = null;
  }

  private clearCloseTimer(): void {
    if (this.closeTimer === null) return;
    clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }
}

export function resolveTooltipSource(
  trigger: HTMLElement,
): HTMLElement | HTMLTemplateElement | null {
  const reference = trigger.getAttribute("data-mr-tooltip")?.trim();
  if (!reference) return null;

  const id = reference.startsWith("#") ? reference.slice(1) : reference;
  if (!id) return null;

  const root = trigger.getRootNode();
  const rootWithIds = root as Node & { getElementById?: (value: string) => Element | null };
  const localMatch = rootWithIds.getElementById?.(id);
  if (isTooltipSource(localMatch)) return localMatch;

  const documentMatch = trigger.ownerDocument.getElementById(id);
  return isTooltipSource(documentMatch) ? documentMatch : null;
}

function cloneTooltipContents(source: HTMLElement | HTMLTemplateElement): DocumentFragment {
  const document = source.ownerDocument;
  if (source.tagName === "TEMPLATE") {
    return (source as HTMLTemplateElement).content.cloneNode(true) as DocumentFragment;
  }

  const fragment = document.createDocumentFragment();
  for (const node of Array.from(source.childNodes)) fragment.append(node.cloneNode(true));
  return fragment;
}

function preparePreviewContents(fragment: DocumentFragment): void {
  const interactiveSelector = [
    "a[href]",
    "button",
    "input",
    "select",
    "textarea",
    "summary",
    "iframe",
    "object",
    "embed",
    "audio[controls]",
    "video[controls]",
    "[contenteditable]:not([contenteditable='false'])",
    "[tabindex]:not([tabindex='-1'])",
    "[role='button']",
    "[role='link']",
    "[role='checkbox']",
    "[role='radio']",
    "[role='switch']",
    "[role='menuitem']",
    "[role='option']",
    "[role='tab']",
  ].join(",");

  /*
   * Preview and pinned surfaces intentionally render the same authored markup.
   * Preview controls stay visually intact so promotion does not reflow, but they
   * are inert and hidden from the accessibility tree until the pinned clone is
   * opened as an interactive Popover Layer.
   */
  for (const element of Array.from(
    fragment.querySelectorAll<HTMLElement>(interactiveSelector),
  )) {
    element.setAttribute("inert", "");
    element.setAttribute("aria-hidden", "true");
    element.removeAttribute("autofocus");
    element.removeAttribute("data-mr-tooltip");
  }

  for (const element of Array.from(fragment.querySelectorAll<HTMLElement>("*"))) {
    element.removeAttribute("id");
    element.removeAttribute("for");
    element.removeAttribute("autofocus");
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name.startsWith("on")) element.removeAttribute(attribute.name);
    }
    for (const attribute of RELATION_ATTRIBUTES) element.removeAttribute(attribute);
  }
}

function getPreviewAccessibleText(fragment: DocumentFragment): string {
  const text = (fragment.textContent ?? "").replace(/\s+/g, " ").trim();
  const labels = Array.from(fragment.querySelectorAll<HTMLElement>("[aria-label]"))
    .map((element) => element.getAttribute("aria-label")?.trim() ?? "")
    .filter((label) => label && !text.includes(label));

  return [text, ...labels].filter(Boolean).join(" ").trim();
}

function createPinProgress(document: Document): HTMLElement {
  const progress = document.createElement("span");
  progress.className = "mr-tooltip__pin-progress";
  progress.setAttribute("data-mr-tooltip-pin-progress", "");
  progress.setAttribute("aria-hidden", "true");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("mr-tooltip__pin-progress-svg");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("focusable", "false");

  const track = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  track.classList.add("mr-tooltip__pin-progress-track");
  track.setAttribute("cx", "10");
  track.setAttribute("cy", "10");
  track.setAttribute("r", "8");
  track.setAttribute("pathLength", "1");

  const value = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  value.classList.add("mr-tooltip__pin-progress-value");
  value.setAttribute("cx", "10");
  value.setAttribute("cy", "10");
  value.setAttribute("r", "8");
  value.setAttribute("pathLength", "1");

  svg.append(track, value);
  progress.append(svg);
  return progress;
}

function getSurfaceHost(trigger: HTMLElement): ParentNode & Node {
  const root = trigger.getRootNode();
  if (root.nodeType === 11 && "append" in root) {
    return root as ParentNode & Node;
  }

  return trigger.ownerDocument.body ?? trigger.ownerDocument.documentElement;
}

function nextSurfaceId(kind: "preview" | "pinned"): string {
  surfaceSequence += 1;
  return `mr-tooltip-${kind}-${surfaceSequence}`;
}

function supportsPopover(document: Document): boolean {
  const HTMLElementConstructor = document.defaultView?.HTMLElement;
  return Boolean(HTMLElementConstructor && "popover" in HTMLElementConstructor.prototype);
}

function isPopoverOpen(surface: HTMLElement): boolean {
  try {
    return surface.matches(":popover-open");
  } catch {
    return false;
  }
}

function addRelationship(trigger: HTMLElement, attribute: string, id: string): void {
  const tokens = new Set((trigger.getAttribute(attribute) ?? "").split(/\s+/).filter(Boolean));
  tokens.add(id);
  trigger.setAttribute(attribute, Array.from(tokens).join(" "));
}

function removeRelationship(trigger: HTMLElement, attribute: string, id: string): void {
  const tokens = (trigger.getAttribute(attribute) ?? "")
    .split(/\s+/)
    .filter((token) => token && token !== id);

  if (tokens.length > 0) trigger.setAttribute(attribute, tokens.join(" "));
  else trigger.removeAttribute(attribute);
}

function findTooltipSurfaceOwner(target: Node): TooltipController | null {
  let element: Element | null = target.nodeType === 1 ? (target as Element) : target.parentElement;
  while (element) {
    const owner = tooltipSurfaceOwners.get(element as HTMLElement);
    if (owner) return owner;
    element = element.parentElement;
  }
  return null;
}

function getRelatedTarget(event: Event): Node | null {
  if (!("relatedTarget" in event)) return null;
  const target = (event as FocusEvent | MouseEvent).relatedTarget;
  return isNode(target) ? target : null;
}

function isNode(value: EventTarget | null): value is Node {
  return Boolean(value && typeof value === "object" && "nodeType" in value);
}

function isTooltipSource(value: Element | null | undefined): value is HTMLElement | HTMLTemplateElement {
  return Boolean(value && value.nodeType === 1 && "ownerDocument" in value);
}
