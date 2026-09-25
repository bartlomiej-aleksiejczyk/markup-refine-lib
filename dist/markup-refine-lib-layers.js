var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const CLOSING_ATTRIBUTE = "data-mr-layer-closing";
const LIFECYCLE_EVENTS = Object.freeze({
  beforeOpen: "mr:layer:beforeopen",
  open: "mr:layer:open",
  beforeClose: "mr:layer:beforeclose",
  close: "mr:layer:close",
  result: "mr:layer:result"
});
class LayerController {
  constructor(element, mode, host) {
    __publicField(this, "element");
    __publicField(this, "mode");
    __publicField(this, "host");
    __publicField(this, "childLayers", /* @__PURE__ */ new Set());
    __publicField(this, "currentState", "closed");
    __publicField(this, "currentTrigger", null);
    __publicField(this, "currentParent", null);
    __publicField(this, "restoreFocusOnClose");
    __publicField(this, "suppressNativeBeforeOpen", false);
    __publicField(this, "suppressNativeBeforeClose", false);
    __publicField(this, "dialogOpenObserver", null);
    __publicField(this, "interactionSession", null);
    __publicField(this, "pendingOutcome", null);
    __publicField(this, "closeOperation", null);
    __publicField(this, "handleBeforeToggle", (event) => {
      const toggleEvent = event;
      if (toggleEvent.newState === "open") {
        this.handleNativeBeforeOpen(toggleEvent);
        return;
      }
      if (toggleEvent.newState === "closed") {
        this.handleNativeBeforeClose(toggleEvent);
      }
    });
    __publicField(this, "handleToggle", (event) => {
      const toggleEvent = event;
      if (toggleEvent.newState === "open") {
        this.settleOpen();
        return;
      }
      if (toggleEvent.newState === "closed") {
        this.settleClosed();
        return;
      }
      this.synchronizeWithNativeState();
    });
    __publicField(this, "handleCancel", (event) => {
      if (this.currentState !== "open") return;
      const beforeClose = this.dispatchLifecycle(LIFECYCLE_EVENTS.beforeClose, event.cancelable);
      if (beforeClose.defaultPrevented && event.cancelable) {
        event.preventDefault();
        return;
      }
      if (event.cancelable) event.preventDefault();
      void this.requestClose({ restoreFocus: true }, false);
    });
    __publicField(this, "handleDialogClose", () => {
      this.settleClosed();
    });
    __publicField(this, "handleDialogLightDismissFallback", (event) => {
      if (!isDialog(this.element) || event.target !== this.element || !hasPointerCoordinates(event)) {
        return;
      }
      const bounds = this.element.getBoundingClientRect();
      const insideSurface = event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      if (insideSurface) return;
      const requestClose = this.element.requestClose;
      if (typeof requestClose === "function") {
        requestClose.call(this.element);
        return;
      }
      void this.close();
    });
    this.element = element;
    this.mode = mode;
    this.host = host;
    this.restoreFocusOnClose = mode !== "popover";
    this.element.addEventListener("beforetoggle", this.handleBeforeToggle);
    this.element.addEventListener("toggle", this.handleToggle);
    if (isDialog(this.element)) {
      this.element.addEventListener("cancel", this.handleCancel);
      this.element.addEventListener("close", this.handleDialogClose);
      this.installDialogLightDismissFallback();
      this.observeDialogOpenAttribute();
    }
    if (this.nativeIsOpen()) {
      this.currentState = "open";
    }
  }
  get state() {
    return this.currentState;
  }
  get trigger() {
    return this.currentTrigger;
  }
  get parent() {
    return this.currentParent;
  }
  get children() {
    return Array.from(this.childLayers);
  }
  async open(options = {}) {
    if (this.closeOperation) await this.closeOperation;
    if (this.currentState === "open" || this.currentState === "opening") return;
    this.element.removeAttribute(CLOSING_ATTRIBUTE);
    const hasExplicitParent = Object.prototype.hasOwnProperty.call(options, "parent");
    const context = this.host.createOpenContext(
      this,
      options.trigger,
      options.parent,
      hasExplicitParent
    );
    this.host.connect(this, context);
    const beforeOpen = this.dispatchLifecycle(LIFECYCLE_EVENTS.beforeOpen, true);
    if (beforeOpen.defaultPrevented) {
      this.host.abortOpening(this);
      return;
    }
    this.currentState = "opening";
    this.suppressNativeBeforeOpen = true;
    try {
      this.nativeOpen();
    } catch (error) {
      this.suppressNativeBeforeOpen = false;
      this.currentState = "closed";
      this.host.abortOpening(this);
      throw error;
    }
    this.suppressNativeBeforeOpen = false;
    this.synchronizeWithNativeState();
  }
  close(options = {}) {
    return this.requestClose(options, true);
  }
  async accept(value) {
    await this.completeWithOutcome({ status: "accepted", value });
  }
  async dismiss(reason) {
    const outcome = reason === void 0 ? { status: "dismissed" } : { status: "dismissed", reason };
    await this.completeWithOutcome(outcome);
  }
  async ask(options = {}) {
    if (this.interactionSession) {
      throw new TypeError("A Layer can have only one active ask() interaction at a time.");
    }
    let resolve;
    const promise = new Promise((resolvePromise) => {
      resolve = resolvePromise;
    });
    const session = { promise, resolve };
    this.interactionSession = session;
    try {
      await this.open(options);
    } catch (error) {
      if (this.interactionSession === session) this.interactionSession = null;
      throw error;
    }
    if (this.currentState === "closed" && this.interactionSession === session) {
      this.publishOutcome({ status: "dismissed" });
    }
    return promise;
  }
  /** @internal */
  setOpenContext(context) {
    this.currentTrigger = context.trigger;
    this.setParent(context.parent);
  }
  /** @internal */
  setParent(parent) {
    var _a, _b;
    if (this.currentParent === parent) return;
    (_a = this.currentParent) == null ? void 0 : _a.childLayers.delete(this);
    this.currentParent = parent;
    (_b = this.currentParent) == null ? void 0 : _b.childLayers.add(this);
  }
  /** @internal */
  detachChildren() {
    for (const child of Array.from(this.childLayers)) {
      child.setParent(null);
    }
  }
  /** @internal */
  nativeIsOpen() {
    if (this.mode === "popover") {
      try {
        return this.element.matches(":popover-open");
      } catch {
        return false;
      }
    }
    return isDialog(this.element) && this.element.hasAttribute("open");
  }
  installDialogLightDismissFallback() {
    var _a;
    if (!isDialog(this.element) || this.element.getAttribute("closedby") !== "any") return;
    const DialogConstructor = (_a = this.element.ownerDocument.defaultView) == null ? void 0 : _a.HTMLDialogElement;
    if (DialogConstructor && "closedBy" in DialogConstructor.prototype) return;
    this.element.addEventListener("click", this.handleDialogLightDismissFallback);
  }
  handleNativeBeforeOpen(event) {
    if (this.suppressNativeBeforeOpen || this.currentState === "opening" || this.currentState === "open") {
      return;
    }
    const source = isHTMLElement$1(event.source) ? event.source : void 0;
    const context = this.host.createOpenContext(this, source, void 0, false);
    this.host.connect(this, context);
    const beforeOpen = this.dispatchLifecycle(LIFECYCLE_EVENTS.beforeOpen, event.cancelable);
    if (beforeOpen.defaultPrevented && event.cancelable) {
      event.preventDefault();
      this.host.abortOpening(this);
      return;
    }
    this.currentState = "opening";
    queueMicrotask(() => {
      if (this.currentState !== "opening") return;
      if (!this.nativeIsOpen()) {
        this.currentState = "closed";
        this.host.abortOpening(this);
      }
    });
  }
  handleNativeBeforeClose(event) {
    if (this.suppressNativeBeforeClose || this.currentState === "closing" || this.currentState === "closed") {
      this.suppressNativeBeforeClose = false;
      return;
    }
    void this.closeChildren();
    this.restoreFocusOnClose = this.mode !== "popover";
    this.dispatchLifecycle(LIFECYCLE_EVENTS.beforeClose, event.cancelable);
    this.currentState = "closing";
    this.element.setAttribute(CLOSING_ATTRIBUTE, "");
  }
  nativeOpen() {
    if (this.mode === "popover") {
      const showPopover = this.element.showPopover;
      if (!this.element.hasAttribute("popover") || typeof showPopover !== "function") {
        throw new TypeError("A popover Layer requires an element with the native popover attribute/API.");
      }
      if (!this.nativeIsOpen()) {
        const openPopover = showPopover;
        openPopover.call(
          this.element,
          this.currentTrigger ? { source: this.currentTrigger } : void 0
        );
      }
      return;
    }
    if (!isDialog(this.element) || typeof this.element.showModal !== "function") {
      throw new TypeError("Modal and drawer Layers require a native <dialog> surface.");
    }
    if (!this.element.open) this.element.showModal();
  }
  nativeClose() {
    if (this.mode === "popover") {
      const hidePopover = this.element.hidePopover;
      if (!this.element.hasAttribute("popover") || typeof hidePopover !== "function") {
        throw new TypeError("A popover Layer requires an element with the native popover attribute/API.");
      }
      if (this.nativeIsOpen()) hidePopover.call(this.element);
      return;
    }
    if (!isDialog(this.element) || typeof this.element.close !== "function") {
      throw new TypeError("Modal and drawer Layers require a native <dialog> surface.");
    }
    if (this.element.open) this.element.close();
  }
  async closeChildren() {
    for (const child of Array.from(this.childLayers).reverse()) {
      await child.close({ restoreFocus: false });
    }
  }
  requestClose(options, dispatchBeforeClose) {
    if (this.currentState === "closed") return Promise.resolve();
    if (this.closeOperation) return this.closeOperation;
    const operation = this.performClose(options, dispatchBeforeClose);
    let tracked;
    tracked = operation.finally(() => {
      if (this.closeOperation === tracked) this.closeOperation = null;
    });
    this.closeOperation = tracked;
    return tracked;
  }
  async performClose(options, dispatchBeforeClose) {
    await this.closeChildren();
    if (this.currentState === "closed") return;
    this.restoreFocusOnClose = options.restoreFocus ?? this.mode !== "popover";
    if (dispatchBeforeClose) {
      this.dispatchLifecycle(LIFECYCLE_EVENTS.beforeClose, false);
    }
    this.currentState = "closing";
    this.element.setAttribute(CLOSING_ATTRIBUTE, "");
    await waitForClosingAnimations(this.element);
    this.suppressNativeBeforeClose = true;
    try {
      this.nativeClose();
    } catch (error) {
      this.suppressNativeBeforeClose = false;
      this.element.removeAttribute(CLOSING_ATTRIBUTE);
      this.currentState = "open";
      throw error;
    }
    this.suppressNativeBeforeClose = false;
    this.synchronizeWithNativeState();
  }
  synchronizeWithNativeState() {
    if (this.nativeIsOpen()) {
      this.settleOpen();
      return;
    }
    if (this.currentState === "opening") {
      this.currentState = "closed";
      this.host.abortOpening(this);
      return;
    }
    if (this.currentState === "closing" || this.currentState === "open") {
      this.settleClosed();
    }
  }
  settleOpen() {
    if (this.currentState === "open") return;
    this.element.removeAttribute(CLOSING_ATTRIBUTE);
    this.currentState = "open";
    this.host.activate(this);
    this.dispatchLifecycle(LIFECYCLE_EVENTS.open, false);
  }
  settleClosed() {
    if (this.currentState === "closed") return;
    const trigger = this.currentTrigger;
    const shouldRestoreFocus = this.restoreFocusOnClose;
    const semanticOutcome = this.pendingOutcome;
    this.pendingOutcome = null;
    this.element.removeAttribute(CLOSING_ATTRIBUTE);
    this.currentState = "closed";
    this.suppressNativeBeforeClose = false;
    this.host.deactivate(this);
    this.dispatchLifecycle(LIFECYCLE_EVENTS.close, false);
    this.restoreFocusOnClose = this.mode !== "popover";
    if (shouldRestoreFocus) restoreFocusWhenAppropriate(this.element, trigger);
    if (semanticOutcome) {
      this.publishOutcome(semanticOutcome);
    } else if (this.interactionSession) {
      this.publishOutcome({ status: "dismissed" });
    }
  }
  async completeWithOutcome(outcome) {
    if (this.pendingOutcome) {
      throw new TypeError("This Layer already has a semantic completion in progress.");
    }
    if (this.currentState === "closed") {
      if (this.interactionSession) this.publishOutcome(outcome);
      return;
    }
    this.pendingOutcome = outcome;
    try {
      await this.close();
    } catch (error) {
      if (this.pendingOutcome === outcome) this.pendingOutcome = null;
      throw error;
    }
  }
  publishOutcome(outcome) {
    const session = this.interactionSession;
    this.interactionSession = null;
    const view = this.element.ownerDocument.defaultView;
    const CustomEventConstructor = (view == null ? void 0 : view.CustomEvent) ?? globalThis.CustomEvent;
    const detail = { layer: this, outcome };
    this.element.dispatchEvent(
      new CustomEventConstructor(LIFECYCLE_EVENTS.result, {
        bubbles: true,
        detail
      })
    );
    session == null ? void 0 : session.resolve(outcome);
  }
  dispatchLifecycle(type, cancelable) {
    const view = this.element.ownerDocument.defaultView;
    const CustomEventConstructor = (view == null ? void 0 : view.CustomEvent) ?? globalThis.CustomEvent;
    const event = new CustomEventConstructor(type, {
      bubbles: true,
      cancelable,
      detail: { layer: this }
    });
    this.element.dispatchEvent(event);
    return event;
  }
  observeDialogOpenAttribute() {
    var _a;
    const Observer = (_a = this.element.ownerDocument.defaultView) == null ? void 0 : _a.MutationObserver;
    if (!Observer) return;
    this.dialogOpenObserver = new Observer(() => {
      this.synchronizeWithNativeState();
    });
    this.dialogOpenObserver.observe(this.element, {
      attributes: true,
      attributeFilter: ["open"]
    });
  }
}
function isDialog(element) {
  return element.tagName === "DIALOG";
}
function isHTMLElement$1(value) {
  return Boolean(value && typeof value.focus === "function");
}
function hasPointerCoordinates(event) {
  return "clientX" in event && "clientY" in event;
}
function restoreFocusWhenAppropriate(surface, trigger) {
  if (!(trigger == null ? void 0 : trigger.isConnected)) return;
  const document2 = surface.ownerDocument;
  const activeElement = document2.activeElement;
  const focusStayedWithLayer = !activeElement || activeElement === document2.body || activeElement === document2.documentElement || activeElement === surface || surface.contains(activeElement);
  if (!focusStayedWithLayer && activeElement !== trigger) return;
  try {
    trigger.focus({ preventScroll: true });
  } catch {
    trigger.focus();
  }
}
async function waitForClosingAnimations(element) {
  await nextAnimationFrame(element);
  const animations = getClosingAnimations(element).filter((animation) => {
    var _a;
    if (animation.playState === "finished" || animation.playState === "idle" || animation.playState === "paused") {
      return false;
    }
    try {
      const endTime = (_a = animation.effect) == null ? void 0 : _a.getComputedTiming().endTime;
      if (typeof endTime === "number" && !Number.isFinite(endTime)) return false;
    } catch {
    }
    return true;
  });
  if (animations.length === 0) return;
  await Promise.allSettled(animations.map((animation) => animation.finished));
}
function getClosingAnimations(element) {
  const nativeGetAnimations = element.getAnimations;
  if (typeof nativeGetAnimations !== "function") return [];
  const getAnimations = nativeGetAnimations;
  const animations = /* @__PURE__ */ new Set();
  const collect = (options) => {
    try {
      for (const animation of getAnimations.call(element, options)) animations.add(animation);
    } catch {
    }
  };
  collect();
  if (isDialog(element)) collect({ pseudoElement: "::backdrop" });
  return Array.from(animations);
}
function nextAnimationFrame(element) {
  var _a;
  const requestFrame = (_a = element.ownerDocument.defaultView) == null ? void 0 : _a.requestAnimationFrame;
  if (typeof requestFrame !== "function") return Promise.resolve();
  return new Promise((resolve) => {
    requestFrame.call(element.ownerDocument.defaultView, () => resolve());
  });
}
const LAYER_SELECTOR = "[data-mr-layer]";
const LAYER_MODES = Object.freeze(["modal", "drawer", "popover"]);
class NativeLayerManager {
  constructor() {
    __publicField(this, "registry", /* @__PURE__ */ new WeakMap());
    __publicField(this, "registeredLayers", /* @__PURE__ */ new Set());
    __publicField(this, "activeLayers", []);
    __publicField(this, "initializedDocuments", /* @__PURE__ */ new WeakSet());
    __publicField(this, "handleDocumentClick", (event) => {
      const target = event.target;
      if (!isNode(target)) return;
      const document2 = getNodeDocument(target);
      if (!document2) return;
      const modal = this.findTopmostModal(document2);
      if (!modal || !isOutsideLayerSurface(event, modal.element, target)) return;
      event.preventDefault();
      event.stopPropagation();
      void this.closeAllForDocument(document2, modal);
    });
  }
  get(target) {
    const element = resolveTarget(target);
    if (!element || !isHTMLElement(element)) return void 0;
    return this.registry.get(element) ?? this.register(element);
  }
  closest(node) {
    let element = node.nodeType === 1 ? node : node.parentElement;
    while (element) {
      const registered = this.registry.get(element);
      if (registered) return registered;
      if (element.matches(LAYER_SELECTOR) && isHTMLElement(element)) {
        const layer = this.register(element);
        if (layer) return layer;
      }
      element = element.parentElement;
    }
    return null;
  }
  async open(target, options = {}) {
    const layer = this.get(target);
    if (!layer) {
      throw new TypeError("Layer target could not be resolved or does not identify a native Layer surface.");
    }
    await layer.open(options);
    return layer;
  }
  async ask(target, options = {}) {
    const layer = this.get(target);
    if (!layer) {
      throw new TypeError("Layer target could not be resolved or does not identify a native Layer surface.");
    }
    return layer.ask(options);
  }
  get current() {
    return this.activeLayers.at(-1) ?? null;
  }
  get stack() {
    return this.activeLayers.slice();
  }
  initialize(root) {
    const target = root ?? getDefaultDocument();
    if (!target) return;
    const document2 = getOwnerDocument(target);
    if (document2) this.installDocumentDismissal(document2);
    if (isHTMLElement(target) && target.matches(LAYER_SELECTOR)) {
      this.register(target);
    }
    target.querySelectorAll(LAYER_SELECTOR).forEach((element) => {
      this.register(element);
    });
  }
  createOpenContext(layer, trigger, parent, hasExplicitParent) {
    const resolvedTrigger = trigger === void 0 ? getActiveHTMLElement(layer.element) : trigger;
    const resolvedParent = hasExplicitParent ? this.resolveExplicitParent(layer, parent ?? null) : this.resolveParentFromTrigger(layer, resolvedTrigger);
    return {
      trigger: resolvedTrigger ?? null,
      parent: resolvedParent
    };
  }
  connect(layer, context) {
    layer.setOpenContext(context);
  }
  activate(layer) {
    if (!this.activeLayers.includes(layer)) this.activeLayers.push(layer);
  }
  deactivate(layer) {
    const activeIndex = this.activeLayers.indexOf(layer);
    if (activeIndex >= 0) this.activeLayers.splice(activeIndex, 1);
    layer.setParent(null);
    layer.detachChildren();
  }
  abortOpening(layer) {
    layer.setParent(null);
  }
  register(element) {
    const existing = this.registry.get(element);
    if (existing) return existing;
    this.installDocumentDismissal(element.ownerDocument);
    const mode = resolveLayerMode(element);
    if (!mode) return void 0;
    const layer = new LayerController(element, mode, this);
    this.registry.set(element, layer);
    this.registeredLayers.add(layer);
    if (layer.state === "open") this.activate(layer);
    return layer;
  }
  installDocumentDismissal(document2) {
    if (this.initializedDocuments.has(document2)) return;
    document2.addEventListener("click", this.handleDocumentClick, true);
    this.initializedDocuments.add(document2);
  }
  findTopmostModal(document2) {
    for (let index = this.activeLayers.length - 1; index >= 0; index -= 1) {
      const layer = this.activeLayers[index];
      if (layer.element.ownerDocument !== document2) continue;
      if (layer.mode !== "modal" && layer.mode !== "drawer") continue;
      if (layer.state === "closed") continue;
      return layer;
    }
    return null;
  }
  async closeAllForDocument(document2, modal) {
    const active = this.activeLayers.filter((layer) => layer.element.ownerDocument === document2);
    if (active.length === 0) return;
    const activeSet = new Set(active);
    const roots = active.filter((layer) => {
      const parent = layer.parent;
      return !(parent instanceof LayerController) || !activeSet.has(parent);
    });
    const focusTarget = findRoot(modal, activeSet).trigger;
    await Promise.all(roots.map((root) => root.close({ restoreFocus: false })));
    if (focusTarget == null ? void 0 : focusTarget.isConnected) focusTarget.focus();
  }
  resolveExplicitParent(layer, parent) {
    if (parent === null) return null;
    if (!(parent instanceof LayerController) || !this.registeredLayers.has(parent)) {
      throw new TypeError("An explicit Layer parent must belong to the same Layer manager.");
    }
    if (parent === layer) {
      throw new TypeError("A Layer cannot be its own parent.");
    }
    if (parent.state !== "open" && parent.state !== "opening") {
      throw new TypeError("An explicit Layer parent must be active.");
    }
    return parent;
  }
  resolveParentFromTrigger(layer, trigger) {
    if (!trigger) return null;
    const candidate = this.closest(trigger);
    if (!(candidate instanceof LayerController) || candidate === layer) return null;
    if (candidate.state !== "open" && candidate.state !== "opening") return null;
    return candidate;
  }
}
const layers = new NativeLayerManager();
function initLayers(root) {
  layers.initialize(root);
}
function resolveTarget(target) {
  var _a;
  if (typeof target !== "string") return target;
  return ((_a = getDefaultDocument()) == null ? void 0 : _a.querySelector(target)) ?? null;
}
function resolveLayerMode(element) {
  var _a;
  const configuredMode = (_a = element.getAttribute("data-mr-layer")) == null ? void 0 : _a.trim();
  if (configuredMode) {
    if (isLayerMode(configuredMode)) return configuredMode;
    console.warn(`Unknown Markup Refine Layer mode: ${configuredMode}`);
    return void 0;
  }
  if (element.hasAttribute("popover")) return "popover";
  if (element.tagName === "DIALOG") return "modal";
  return void 0;
}
function isLayerMode(value) {
  return LAYER_MODES.includes(value);
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
function findRoot(layer, active) {
  let current = layer;
  while (current.parent instanceof LayerController && active.has(current.parent)) {
    current = current.parent;
  }
  return current;
}
function isOutsideLayerSurface(event, surface, target) {
  if (target !== surface && surface.contains(target)) return false;
  const bounds = surface.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
}
function isNode(value) {
  return Boolean(
    value && typeof value === "object" && "nodeType" in value
  );
}
function getActiveHTMLElement(surface) {
  const activeElement = surface.ownerDocument.activeElement;
  return isHTMLElement(activeElement) ? activeElement : null;
}
function isHTMLElement(value) {
  return Boolean(
    value && typeof value === "object" && "nodeType" in value && value.nodeType === 1 && "focus" in value && typeof value.focus === "function"
  );
}
export {
  initLayers,
  layers
};
//# sourceMappingURL=markup-refine-lib-layers.js.map
