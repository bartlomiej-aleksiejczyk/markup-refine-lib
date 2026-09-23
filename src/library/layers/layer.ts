import type {
  Layer,
  LayerCloseOptions,
  LayerMode,
  LayerOpenOptions,
  LayerOutcome,
  LayerResultEventDetail,
  LayerState,
} from "./types";

export interface LayerOpenContext {
  trigger: HTMLElement | null;
  parent: LayerController | null;
}

export interface LayerRegistryHost {
  createOpenContext(
    layer: LayerController,
    trigger: HTMLElement | null | undefined,
    parent: Layer | null | undefined,
    hasExplicitParent: boolean,
  ): LayerOpenContext;
  connect(layer: LayerController, context: LayerOpenContext): void;
  activate(layer: LayerController): void;
  deactivate(layer: LayerController): void;
  abortOpening(layer: LayerController): void;
}

interface LayerInteractionSession {
  promise: Promise<LayerOutcome<unknown, unknown>>;
  resolve: (outcome: LayerOutcome<unknown, unknown>) => void;
}

type ToggleLikeEvent = Event & {
  newState?: "open" | "closed";
  source?: Element | null;
};

const CLOSING_ATTRIBUTE = "data-mr-layer-closing";

const LIFECYCLE_EVENTS = Object.freeze({
  beforeOpen: "mr:layer:beforeopen",
  open: "mr:layer:open",
  beforeClose: "mr:layer:beforeclose",
  close: "mr:layer:close",
  result: "mr:layer:result",
});

export class LayerController implements Layer {
  readonly element: HTMLElement;
  readonly mode: LayerMode;

  private readonly host: LayerRegistryHost;
  private readonly childLayers = new Set<LayerController>();
  private currentState: LayerState = "closed";
  private currentTrigger: HTMLElement | null = null;
  private currentParent: LayerController | null = null;
  private restoreFocusOnClose: boolean;
  private suppressNativeBeforeOpen = false;
  private suppressNativeBeforeClose = false;
  private dialogOpenObserver: MutationObserver | null = null;
  private interactionSession: LayerInteractionSession | null = null;
  private pendingOutcome: LayerOutcome<unknown, unknown> | null = null;
  private closeOperation: Promise<void> | null = null;

  constructor(element: HTMLElement, mode: LayerMode, host: LayerRegistryHost) {
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

  get state(): LayerState {
    return this.currentState;
  }

  get trigger(): HTMLElement | null {
    return this.currentTrigger;
  }

  get parent(): Layer | null {
    return this.currentParent;
  }

  get children(): readonly Layer[] {
    return Array.from(this.childLayers);
  }

  async open(options: LayerOpenOptions = {}): Promise<void> {
    if (this.closeOperation) await this.closeOperation;
    if (this.currentState === "open" || this.currentState === "opening") return;

    this.element.removeAttribute(CLOSING_ATTRIBUTE);
    const hasExplicitParent = Object.prototype.hasOwnProperty.call(options, "parent");
    const context = this.host.createOpenContext(
      this,
      options.trigger,
      options.parent,
      hasExplicitParent,
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

  close(options: LayerCloseOptions = {}): Promise<void> {
    return this.requestClose(options, true);
  }

  async accept<T>(value: T): Promise<void> {
    await this.completeWithOutcome({ status: "accepted", value });
  }

  async dismiss<R = unknown>(reason?: R): Promise<void> {
    const outcome: LayerOutcome<never, R> =
      reason === undefined
        ? { status: "dismissed" }
        : { status: "dismissed", reason };
    await this.completeWithOutcome(outcome);
  }

  async ask<T, R = unknown>(options: LayerOpenOptions = {}): Promise<LayerOutcome<T, R>> {
    if (this.interactionSession) {
      throw new TypeError("A Layer can have only one active ask() interaction at a time.");
    }

    let resolve!: (outcome: LayerOutcome<unknown, unknown>) => void;
    const promise = new Promise<LayerOutcome<unknown, unknown>>((resolvePromise) => {
      resolve = resolvePromise;
    });
    const session: LayerInteractionSession = { promise, resolve };
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

    return promise as Promise<LayerOutcome<T, R>>;
  }

  /** @internal */
  setOpenContext(context: LayerOpenContext): void {
    this.currentTrigger = context.trigger;
    this.setParent(context.parent);
  }

  /** @internal */
  setParent(parent: LayerController | null): void {
    if (this.currentParent === parent) return;
    this.currentParent?.childLayers.delete(this);
    this.currentParent = parent;
    this.currentParent?.childLayers.add(this);
  }

  /** @internal */
  detachChildren(): void {
    for (const child of Array.from(this.childLayers)) {
      child.setParent(null);
    }
  }

  /** @internal */
  nativeIsOpen(): boolean {
    if (this.mode === "popover") {
      try {
        return this.element.matches(":popover-open");
      } catch {
        return false;
      }
    }

    return isDialog(this.element) && this.element.hasAttribute("open");
  }

  private readonly handleBeforeToggle = (event: Event): void => {
    const toggleEvent = event as ToggleLikeEvent;
    if (toggleEvent.newState === "open") {
      this.handleNativeBeforeOpen(toggleEvent);
      return;
    }

    if (toggleEvent.newState === "closed") {
      this.handleNativeBeforeClose(toggleEvent);
    }
  };

  private readonly handleToggle = (event: Event): void => {
    const toggleEvent = event as ToggleLikeEvent;
    if (toggleEvent.newState === "open") {
      this.settleOpen();
      return;
    }

    if (toggleEvent.newState === "closed") {
      this.settleClosed();
      return;
    }

    this.synchronizeWithNativeState();
  };

  private readonly handleCancel = (event: Event): void => {
    if (this.currentState !== "open") return;

    const beforeClose = this.dispatchLifecycle(LIFECYCLE_EVENTS.beforeClose, event.cancelable);
    if (beforeClose.defaultPrevented && event.cancelable) {
      event.preventDefault();
      return;
    }

    /*
     * Keep the native dialog open while the Layer performs its exit animation.
     * requestClose()/Escape expose a cancelable `cancel` event, so the Layer can
     * defer the actual native close without inventing a parallel close watcher.
     */
    if (event.cancelable) event.preventDefault();
    void this.requestClose({ restoreFocus: true }, false);
  };

  private readonly handleDialogClose = (): void => {
    this.settleClosed();
  };

  private readonly handleDialogLightDismissFallback = (event: Event): void => {
    if (
      !isDialog(this.element) ||
      event.target !== this.element ||
      !hasPointerCoordinates(event)
    ) {
      return;
    }

    const bounds = this.element.getBoundingClientRect();
    const insideSurface =
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;
    if (insideSurface) return;

    const requestClose = (this.element as HTMLDialogElement & { requestClose?: () => void })
      .requestClose;
    if (typeof requestClose === "function") {
      requestClose.call(this.element);
      return;
    }

    void this.close();
  };

  private installDialogLightDismissFallback(): void {
    if (!isDialog(this.element) || this.element.getAttribute("closedby") !== "any") return;

    const DialogConstructor = this.element.ownerDocument.defaultView?.HTMLDialogElement;
    if (DialogConstructor && "closedBy" in DialogConstructor.prototype) return;

    this.element.addEventListener("click", this.handleDialogLightDismissFallback);
  }

  private handleNativeBeforeOpen(event: ToggleLikeEvent): void {
    if (this.suppressNativeBeforeOpen || this.currentState === "opening" || this.currentState === "open") {
      return;
    }

    const source = isHTMLElement(event.source) ? event.source : undefined;
    const context = this.host.createOpenContext(this, source, undefined, false);
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

  private handleNativeBeforeClose(event: ToggleLikeEvent): void {
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

  private nativeOpen(): void {
    if (this.mode === "popover") {
      const showPopover = this.element.showPopover;
      if (!this.element.hasAttribute("popover") || typeof showPopover !== "function") {
        throw new TypeError("A popover Layer requires an element with the native popover attribute/API.");
      }
      if (!this.nativeIsOpen()) {
        const openPopover = showPopover as (options?: { source?: HTMLElement }) => void;
        openPopover.call(
          this.element,
          this.currentTrigger ? { source: this.currentTrigger } : undefined,
        );
      }
      return;
    }

    if (!isDialog(this.element) || typeof this.element.showModal !== "function") {
      throw new TypeError("Modal and drawer Layers require a native <dialog> surface.");
    }
    if (!this.element.open) this.element.showModal();
  }

  private nativeClose(): void {
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

  private async closeChildren(): Promise<void> {
    for (const child of Array.from(this.childLayers).reverse()) {
      await child.close({ restoreFocus: false });
    }
  }

  private requestClose(
    options: LayerCloseOptions,
    dispatchBeforeClose: boolean,
  ): Promise<void> {
    if (this.currentState === "closed") return Promise.resolve();
    if (this.closeOperation) return this.closeOperation;

    const operation = this.performClose(options, dispatchBeforeClose);
    let tracked!: Promise<void>;
    tracked = operation.finally(() => {
      if (this.closeOperation === tracked) this.closeOperation = null;
    });
    this.closeOperation = tracked;
    return tracked;
  }

  private async performClose(
    options: LayerCloseOptions,
    dispatchBeforeClose: boolean,
  ): Promise<void> {
    await this.closeChildren();
    if (this.currentState === "closed") return;

    this.restoreFocusOnClose = options.restoreFocus ?? this.mode !== "popover";
    if (dispatchBeforeClose) {
      this.dispatchLifecycle(LIFECYCLE_EVENTS.beforeClose, false);
    }

    this.currentState = "closing";
    this.element.setAttribute(CLOSING_ATTRIBUTE, "");

    /*
     * Keep the native surface open/in the top layer until any CSS transition or
     * animation started by the closing marker has finished. This means custom
     * presentation can choose its own duration; Layer core does not hard-code a
     * timeout. Reduced-motion styles naturally produce no wait.
     */
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

  private synchronizeWithNativeState(): void {
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

  private settleOpen(): void {
    if (this.currentState === "open") return;
    this.element.removeAttribute(CLOSING_ATTRIBUTE);
    this.currentState = "open";
    this.host.activate(this);
    this.dispatchLifecycle(LIFECYCLE_EVENTS.open, false);
  }

  private settleClosed(): void {
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

  private async completeWithOutcome(outcome: LayerOutcome<unknown, unknown>): Promise<void> {
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

  private publishOutcome(outcome: LayerOutcome<unknown, unknown>): void {
    const session = this.interactionSession;
    this.interactionSession = null;

    const view = this.element.ownerDocument.defaultView;
    const CustomEventConstructor = view?.CustomEvent ?? globalThis.CustomEvent;
    const detail: LayerResultEventDetail = { layer: this, outcome };
    this.element.dispatchEvent(
      new CustomEventConstructor(LIFECYCLE_EVENTS.result, {
        bubbles: true,
        detail,
      }),
    );

    session?.resolve(outcome);
  }

  private dispatchLifecycle(type: string, cancelable: boolean): CustomEvent<{ layer: Layer }> {
    const view = this.element.ownerDocument.defaultView;
    const CustomEventConstructor = view?.CustomEvent ?? globalThis.CustomEvent;
    const event = new CustomEventConstructor(type, {
      bubbles: true,
      cancelable,
      detail: { layer: this },
    });
    this.element.dispatchEvent(event);
    return event;
  }

  private observeDialogOpenAttribute(): void {
    const Observer = this.element.ownerDocument.defaultView?.MutationObserver;
    if (!Observer) return;

    this.dialogOpenObserver = new Observer(() => {
      this.synchronizeWithNativeState();
    });
    this.dialogOpenObserver.observe(this.element, {
      attributes: true,
      attributeFilter: ["open"],
    });
  }
}

function isDialog(element: HTMLElement): element is HTMLDialogElement {
  return element.tagName === "DIALOG";
}

function isHTMLElement(value: Element | null | undefined): value is HTMLElement {
  return Boolean(value && typeof (value as HTMLElement).focus === "function");
}

function hasPointerCoordinates(event: Event): event is Event & { clientX: number; clientY: number } {
  return "clientX" in event && "clientY" in event;
}

function restoreFocusWhenAppropriate(surface: HTMLElement, trigger: HTMLElement | null): void {
  if (!trigger?.isConnected) return;

  const document = surface.ownerDocument;
  const activeElement = document.activeElement;
  const focusStayedWithLayer =
    !activeElement ||
    activeElement === document.body ||
    activeElement === document.documentElement ||
    activeElement === surface ||
    surface.contains(activeElement);

  if (!focusStayedWithLayer && activeElement !== trigger) return;

  try {
    trigger.focus({ preventScroll: true });
  } catch {
    trigger.focus();
  }
}

async function waitForClosingAnimations(element: HTMLElement): Promise<void> {
  await nextAnimationFrame(element);

  const animations = getClosingAnimations(element).filter((animation) => {
    if (
      animation.playState === "finished" ||
      animation.playState === "idle" ||
      animation.playState === "paused"
    ) {
      return false;
    }

    try {
      const endTime = animation.effect?.getComputedTiming().endTime;
      if (typeof endTime === "number" && !Number.isFinite(endTime)) return false;
    } catch {
      // A custom AnimationEffect may not expose computed timing. Its finished
      // promise is still the most accurate signal available.
    }

    return true;
  });

  if (animations.length === 0) return;
  await Promise.allSettled(animations.map((animation) => animation.finished));
}

function getClosingAnimations(element: HTMLElement): Animation[] {
  const nativeGetAnimations = element.getAnimations;
  if (typeof nativeGetAnimations !== "function") return [];
  const getAnimations = nativeGetAnimations as unknown as (
    options?: { subtree?: boolean; pseudoElement?: string },
  ) => Animation[];

  const animations = new Set<Animation>();
  const collect = (options?: { subtree?: boolean; pseudoElement?: string }): void => {
    try {
      for (const animation of getAnimations.call(element, options)) animations.add(animation);
    } catch {
      // Older implementations may not understand pseudoElement queries. The
      // base query still covers animations targeting the Layer surface itself.
    }
  };

  collect();
  if (isDialog(element)) collect({ pseudoElement: "::backdrop" });
  return Array.from(animations);
}

function nextAnimationFrame(element: HTMLElement): Promise<void> {
  const requestFrame = element.ownerDocument.defaultView?.requestAnimationFrame;
  if (typeof requestFrame !== "function") return Promise.resolve();

  return new Promise((resolve) => {
    requestFrame.call(element.ownerDocument.defaultView, () => resolve());
  });
}
