var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { layers } from "./markup-refine-lib-layers.js";
const PREVIEW_RELATION = "aria-describedby";
const PINNED_RELATION = "aria-details";
const RELATION_ATTRIBUTES = Object.freeze([
  "aria-labelledby",
  "aria-describedby",
  "aria-details",
  "aria-controls",
  "aria-owns"
]);
let surfaceSequence = 0;
const tooltipSurfaceOwners = /* @__PURE__ */ new WeakMap();
class TooltipController {
  constructor(trigger, source, host) {
    __publicField(this, "trigger");
    __publicField(this, "host");
    __publicField(this, "source");
    __publicField(this, "currentState", "hidden");
    __publicField(this, "previewSurface", null);
    __publicField(this, "pinnedSurface", null);
    __publicField(this, "pinnedLayer", null);
    __publicField(this, "showTimer", null);
    __publicField(this, "pinTimer", null);
    __publicField(this, "closeTimer", null);
    __publicField(this, "handleTriggerEnter", () => {
      this.show();
    });
    __publicField(this, "handleTriggerPointerLeave", () => {
      if (this.currentState === "pinned") return;
      this.hideNow();
    });
    __publicField(this, "handleTriggerFocusOut", (event) => {
      if (this.currentState === "pinned") return;
      if (this.containsInteractionTarget(getRelatedTarget(event))) {
        this.clearCloseTimer();
        return;
      }
      this.hide();
    });
    __publicField(this, "handleSurfaceEnter", () => {
      this.clearCloseTimer();
    });
    __publicField(this, "handleSurfaceLeave", (event) => {
      if (this.currentState === "pinned") return;
      if (this.containsInteractionTarget(getRelatedTarget(event))) {
        this.clearCloseTimer();
        return;
      }
      this.hide();
    });
    __publicField(this, "handlePreviewToggle", () => {
      if (this.currentState !== "preview" || !this.previewSurface) return;
      if (isPopoverOpen(this.previewSurface)) return;
      removeRelationship(this.trigger, PREVIEW_RELATION, this.previewSurface.id);
      this.previewSurface.removeAttribute("data-mr-tooltip-pinning");
      this.host.deactivatePreview(this);
      this.clearPinTimer();
      this.currentState = "hidden";
    });
    __publicField(this, "handlePinnedLayerClose", (event) => {
      if (event.target !== this.pinnedSurface) return;
      this.finishPinnedClose();
    });
    __publicField(this, "handleDismissClick", () => {
      this.dismissPinned(true);
    });
    this.trigger = trigger;
    this.source = source;
    this.host = host;
    this.trigger.addEventListener("pointerenter", this.handleTriggerEnter);
    this.trigger.addEventListener("pointerleave", this.handleTriggerPointerLeave);
    this.trigger.addEventListener("focusin", this.handleTriggerEnter);
    this.trigger.addEventListener("focusout", this.handleTriggerFocusOut);
  }
  get state() {
    return this.currentState;
  }
  show() {
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
  hide() {
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
  pin() {
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
  unpin() {
    this.dismissPinned(false);
  }
  /** @internal Used by the registry for deterministic global dismissal. */
  hideNow() {
    this.clearTimers();
    this.hideImmediately();
  }
  /** @internal Used by the registry for explicit outside/Escape dismissal. */
  dismissPinned(restoreFocus) {
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
  ownsInteractionTarget(target) {
    return this.containsInteractionTarget(target);
  }
  showPreview() {
    if (this.currentState !== "waiting") return;
    if (!supportsPopover(this.trigger.ownerDocument)) {
      this.currentState = "hidden";
      return;
    }
    const surface = this.ensurePreviewSurface();
    surface.removeAttribute("data-mr-tooltip-promoting");
    const showPopover = surface.showPopover;
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
  hideImmediately() {
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
  hidePreviewSurface() {
    const surface = this.previewSurface;
    if (!surface) return;
    surface.removeAttribute("data-mr-tooltip-pinning");
    this.host.deactivatePreview(this);
    removeRelationship(this.trigger, PREVIEW_RELATION, surface.id);
    if (isPopoverOpen(surface) && typeof surface.hidePopover === "function") {
      try {
        surface.hidePopover();
      } catch {
      }
    }
  }
  finishPinnedClose() {
    this.host.deactivatePinned(this);
    if (this.pinnedSurface) {
      removeRelationship(this.trigger, PINNED_RELATION, this.pinnedSurface.id);
    }
    this.currentState = "hidden";
    this.clearTimers();
  }
  ensurePreviewSurface() {
    if (this.previewSurface) return this.previewSurface;
    const document2 = this.trigger.ownerDocument;
    const surface = document2.createElement("div");
    surface.id = nextSurfaceId("preview");
    surface.className = "mr-tooltip mr-tooltip--preview";
    surface.setAttribute("popover", "hint");
    surface.setAttribute("role", "tooltip");
    surface.setAttribute("data-mr-tooltip-preview", "");
    const contents = cloneTooltipContents(this.source);
    const accessibleText = getPreviewAccessibleText(contents);
    preparePreviewContents(contents);
    if (accessibleText) surface.setAttribute("aria-label", accessibleText);
    surface.append(contents, createPinProgress(document2));
    getSurfaceHost(this.trigger).append(surface);
    surface.addEventListener("pointerenter", this.handleSurfaceEnter);
    surface.addEventListener("pointerleave", this.handleSurfaceLeave);
    surface.addEventListener("toggle", this.handlePreviewToggle);
    tooltipSurfaceOwners.set(surface, this);
    this.previewSurface = surface;
    return surface;
  }
  ensurePinnedSurface() {
    if (this.pinnedSurface) return this.pinnedSurface;
    const document2 = this.trigger.ownerDocument;
    const surface = document2.createElement("div");
    surface.id = nextSurfaceId("pinned");
    surface.className = "mr-layer mr-layer--popover mr-tooltip mr-tooltip--pinned";
    surface.setAttribute("popover", "manual");
    surface.setAttribute("data-mr-layer", "popover");
    surface.setAttribute("data-mr-tooltip-pinned", "");
    const dismissButton = document2.createElement("button");
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
  containsInteractionTarget(target) {
    var _a, _b;
    if (!target) return false;
    if (this.trigger === target || this.trigger.contains(target)) return true;
    if ((_a = this.previewSurface) == null ? void 0 : _a.contains(target)) return true;
    if ((_b = this.pinnedSurface) == null ? void 0 : _b.contains(target)) return true;
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
  containsNestedTooltipSurface(target) {
    var _a;
    const nestedTooltip = findTooltipSurfaceOwner(target);
    if (!nestedTooltip || nestedTooltip === this) return false;
    if ((_a = this.pinnedSurface) == null ? void 0 : _a.contains(nestedTooltip.trigger)) return true;
    const ownLayer = this.pinnedLayer;
    if (!ownLayer) return false;
    let triggerLayer = layers.closest(nestedTooltip.trigger);
    while (triggerLayer) {
      if (triggerLayer === ownLayer) return true;
      triggerLayer = triggerLayer.parent;
    }
    return false;
  }
  clearTimers() {
    this.clearShowTimer();
    this.clearPinTimer();
    this.clearCloseTimer();
  }
  clearShowTimer() {
    if (this.showTimer === null) return;
    clearTimeout(this.showTimer);
    this.showTimer = null;
  }
  clearPinTimer() {
    if (this.pinTimer === null) return;
    clearTimeout(this.pinTimer);
    this.pinTimer = null;
  }
  clearCloseTimer() {
    if (this.closeTimer === null) return;
    clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }
}
function resolveTooltipSource(trigger) {
  var _a, _b;
  const reference = (_a = trigger.getAttribute("data-mr-tooltip")) == null ? void 0 : _a.trim();
  if (!reference) return null;
  const id = reference.startsWith("#") ? reference.slice(1) : reference;
  if (!id) return null;
  const root = trigger.getRootNode();
  const rootWithIds = root;
  const localMatch = (_b = rootWithIds.getElementById) == null ? void 0 : _b.call(rootWithIds, id);
  if (isTooltipSource(localMatch)) return localMatch;
  const documentMatch = trigger.ownerDocument.getElementById(id);
  return isTooltipSource(documentMatch) ? documentMatch : null;
}
function cloneTooltipContents(source) {
  const document2 = source.ownerDocument;
  if (source.tagName === "TEMPLATE") {
    return source.content.cloneNode(true);
  }
  const fragment = document2.createDocumentFragment();
  for (const node of Array.from(source.childNodes)) fragment.append(node.cloneNode(true));
  return fragment;
}
function preparePreviewContents(fragment) {
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
    "[role='tab']"
  ].join(",");
  for (const element of Array.from(
    fragment.querySelectorAll(interactiveSelector)
  )) {
    element.setAttribute("inert", "");
    element.setAttribute("aria-hidden", "true");
    element.removeAttribute("autofocus");
    element.removeAttribute("data-mr-tooltip");
  }
  for (const element of Array.from(fragment.querySelectorAll("*"))) {
    element.removeAttribute("id");
    element.removeAttribute("for");
    element.removeAttribute("autofocus");
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name.startsWith("on")) element.removeAttribute(attribute.name);
    }
    for (const attribute of RELATION_ATTRIBUTES) element.removeAttribute(attribute);
  }
}
function getPreviewAccessibleText(fragment) {
  const text = (fragment.textContent ?? "").replace(/\s+/g, " ").trim();
  const labels = Array.from(fragment.querySelectorAll("[aria-label]")).map((element) => {
    var _a;
    return ((_a = element.getAttribute("aria-label")) == null ? void 0 : _a.trim()) ?? "";
  }).filter((label) => label && !text.includes(label));
  return [text, ...labels].filter(Boolean).join(" ").trim();
}
function createPinProgress(document2) {
  const progress = document2.createElement("span");
  progress.className = "mr-tooltip__pin-progress";
  progress.setAttribute("data-mr-tooltip-pin-progress", "");
  progress.setAttribute("aria-hidden", "true");
  const svg = document2.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("mr-tooltip__pin-progress-svg");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("focusable", "false");
  const track = document2.createElementNS("http://www.w3.org/2000/svg", "circle");
  track.classList.add("mr-tooltip__pin-progress-track");
  track.setAttribute("cx", "10");
  track.setAttribute("cy", "10");
  track.setAttribute("r", "8");
  track.setAttribute("pathLength", "1");
  const value = document2.createElementNS("http://www.w3.org/2000/svg", "circle");
  value.classList.add("mr-tooltip__pin-progress-value");
  value.setAttribute("cx", "10");
  value.setAttribute("cy", "10");
  value.setAttribute("r", "8");
  value.setAttribute("pathLength", "1");
  svg.append(track, value);
  progress.append(svg);
  return progress;
}
function getSurfaceHost(trigger) {
  const root = trigger.getRootNode();
  if (root.nodeType === 11 && "append" in root) {
    return root;
  }
  return trigger.ownerDocument.body ?? trigger.ownerDocument.documentElement;
}
function nextSurfaceId(kind) {
  surfaceSequence += 1;
  return `mr-tooltip-${kind}-${surfaceSequence}`;
}
function supportsPopover(document2) {
  var _a;
  const HTMLElementConstructor = (_a = document2.defaultView) == null ? void 0 : _a.HTMLElement;
  return Boolean(HTMLElementConstructor && "popover" in HTMLElementConstructor.prototype);
}
function isPopoverOpen(surface) {
  try {
    return surface.matches(":popover-open");
  } catch {
    return false;
  }
}
function addRelationship(trigger, attribute, id) {
  const tokens = new Set((trigger.getAttribute(attribute) ?? "").split(/\s+/).filter(Boolean));
  tokens.add(id);
  trigger.setAttribute(attribute, Array.from(tokens).join(" "));
}
function removeRelationship(trigger, attribute, id) {
  const tokens = (trigger.getAttribute(attribute) ?? "").split(/\s+/).filter((token) => token && token !== id);
  if (tokens.length > 0) trigger.setAttribute(attribute, tokens.join(" "));
  else trigger.removeAttribute(attribute);
}
function findTooltipSurfaceOwner(target) {
  let element = target.nodeType === 1 ? target : target.parentElement;
  while (element) {
    const owner = tooltipSurfaceOwners.get(element);
    if (owner) return owner;
    element = element.parentElement;
  }
  return null;
}
function getRelatedTarget(event) {
  if (!("relatedTarget" in event)) return null;
  const target = event.relatedTarget;
  return isNode$1(target) ? target : null;
}
function isNode$1(value) {
  return Boolean(value && typeof value === "object" && "nodeType" in value);
}
function isTooltipSource(value) {
  return Boolean(value && value.nodeType === 1 && "ownerDocument" in value);
}
const TOOLTIP_SELECTOR = "[data-mr-tooltip]";
const DEFAULT_TOOLTIP_OPTIONS = Object.freeze({
  showDelay: 400,
  pinDelay: 1600,
  closeDelay: 250
});
class NativeTooltipRegistry {
  constructor() {
    __publicField(this, "registry", /* @__PURE__ */ new WeakMap());
    __publicField(this, "registeredTooltips", /* @__PURE__ */ new Set());
    __publicField(this, "activePreviews", []);
    __publicField(this, "pinnedTooltips", []);
    __publicField(this, "initializedDocuments", /* @__PURE__ */ new WeakSet());
    __publicField(this, "currentOptions", { ...DEFAULT_TOOLTIP_OPTIONS });
    __publicField(this, "handleDocumentPointerDown", (event) => {
      const target = event.target;
      if (!isNode(target)) return;
      const document2 = getNodeDocument(target);
      if (!document2) return;
      const previews = tooltipsForDocument(this.activePreviews, document2);
      const pinned = tooltipsForDocument(this.pinnedTooltips, document2);
      if (previews.length === 0 && pinned.length === 0) return;
      const current = previews.at(-1) ?? pinned.at(-1) ?? null;
      if (current == null ? void 0 : current.ownsInteractionTarget(target)) return;
      for (const tooltip of Array.from(/* @__PURE__ */ new Set([...previews, ...pinned])).reverse()) {
        tooltip.hideNow();
      }
    });
    __publicField(this, "handleDocumentKeyDown", (event) => {
      if (event.key !== "Escape") return;
      const target = event.target;
      const document2 = isNode(target) ? getNodeDocument(target) : getDefaultDocument();
      if (!document2) return;
      if (findLastForDocument(this.activePreviews, document2)) return;
      const current = findLastForDocument(this.pinnedTooltips, document2);
      if (!current) return;
      event.preventDefault();
      event.stopPropagation();
      current.dismissPinned(true);
    });
  }
  get options() {
    return this.currentOptions;
  }
  configure(options) {
    this.currentOptions = {
      ...this.currentOptions,
      ...validateOptions(options)
    };
  }
  get(trigger) {
    const existing = this.registry.get(trigger);
    if (existing) return existing;
    if (!trigger.matches(TOOLTIP_SELECTOR)) return null;
    return this.register(trigger);
  }
  closest(node) {
    let element = node.nodeType === 1 ? node : node.parentElement;
    while (element) {
      if (isHTMLElement(element) && element.matches(TOOLTIP_SELECTOR)) {
        return this.get(element);
      }
      element = element.parentElement;
    }
    return null;
  }
  pin(trigger) {
    var _a;
    (_a = this.get(trigger)) == null ? void 0 : _a.pin();
  }
  hideAll() {
    for (const tooltip of this.registeredTooltips) tooltip.hideNow();
  }
  activatePreview(tooltip) {
    moveToEnd(this.activePreviews, tooltip);
  }
  deactivatePreview(tooltip) {
    removeFromList(this.activePreviews, tooltip);
  }
  activatePinned(tooltip) {
    moveToEnd(this.pinnedTooltips, tooltip);
  }
  deactivatePinned(tooltip) {
    removeFromList(this.pinnedTooltips, tooltip);
  }
  initialize(root) {
    const target = root ?? getDefaultDocument();
    if (!target) return;
    const document2 = getOwnerDocument(target);
    if (document2) this.installDocumentDismissal(document2);
    if (isHTMLElement(target) && target.matches(TOOLTIP_SELECTOR)) {
      this.register(target);
    }
    target.querySelectorAll(TOOLTIP_SELECTOR).forEach((trigger) => {
      this.register(trigger);
    });
  }
  register(trigger) {
    const existing = this.registry.get(trigger);
    if (existing) return existing;
    const source = resolveTooltipSource(trigger);
    if (!source) {
      console.warn(
        `Markup Refine tooltip source '${trigger.getAttribute("data-mr-tooltip") ?? ""}' could not be resolved.`
      );
      return null;
    }
    const tooltip = new TooltipController(trigger, source, this);
    this.installDocumentDismissal(trigger.ownerDocument);
    this.registry.set(trigger, tooltip);
    this.registeredTooltips.add(tooltip);
    return tooltip;
  }
  installDocumentDismissal(document2) {
    if (this.initializedDocuments.has(document2)) return;
    document2.addEventListener("pointerdown", this.handleDocumentPointerDown, true);
    document2.addEventListener("keydown", this.handleDocumentKeyDown, true);
    this.initializedDocuments.add(document2);
  }
}
const tooltips = new NativeTooltipRegistry();
function initTooltips(root) {
  tooltips.initialize(root);
}
function validateOptions(options) {
  const validated = {};
  for (const key of ["showDelay", "pinDelay", "closeDelay"]) {
    const value = options[key];
    if (value === void 0) continue;
    if (!Number.isFinite(value) || value < 0) {
      throw new TypeError(`Tooltip ${key} must be a finite number greater than or equal to zero.`);
    }
    validated[key] = value;
  }
  return validated;
}
function getDefaultDocument() {
  return typeof document === "undefined" ? null : document;
}
function getOwnerDocument(root) {
  if (!isNode(root)) return null;
  return root.nodeType === 9 ? root : root.ownerDocument;
}
function getNodeDocument(node) {
  return node.nodeType === 9 ? node : node.ownerDocument;
}
function moveToEnd(list, tooltip) {
  removeFromList(list, tooltip);
  list.push(tooltip);
}
function removeFromList(list, tooltip) {
  const index = list.indexOf(tooltip);
  if (index >= 0) list.splice(index, 1);
}
function tooltipsForDocument(list, document2) {
  return list.filter((tooltip) => tooltip.trigger.ownerDocument === document2);
}
function findLastForDocument(list, document2) {
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const tooltip = list[index];
    if (tooltip.trigger.ownerDocument === document2) return tooltip;
  }
  return null;
}
function isHTMLElement(value) {
  return Boolean(
    value && typeof value === "object" && "nodeType" in value && value.nodeType === 1 && "matches" in value
  );
}
function isNode(value) {
  return Boolean(value && typeof value === "object" && "nodeType" in value);
}
export {
  DEFAULT_TOOLTIP_OPTIONS,
  initTooltips,
  tooltips
};
//# sourceMappingURL=markup-refine-lib-tooltips.js.map
