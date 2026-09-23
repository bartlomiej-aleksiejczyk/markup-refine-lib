import { LayerController, type LayerOpenContext, type LayerRegistryHost } from "./layer";
import type { Layer, LayerManager, LayerMode, LayerOpenOptions, LayerOutcome } from "./types";

const LAYER_SELECTOR = "[data-mr-layer]";
const LAYER_MODES: readonly LayerMode[] = Object.freeze(["modal", "drawer", "popover"]);

export class NativeLayerManager implements LayerManager, LayerRegistryHost {
  private readonly registry = new WeakMap<Element, LayerController>();
  private readonly registeredLayers = new Set<LayerController>();
  private readonly activeLayers: LayerController[] = [];
  private readonly initializedDocuments = new WeakSet<Document>();

  get(target: Element | string): Layer | undefined {
    const element = resolveTarget(target);
    if (!element || !isHTMLElement(element)) return undefined;

    return this.registry.get(element) ?? this.register(element);
  }

  closest(node: Node): Layer | null {
    let element: Element | null = node.nodeType === 1 ? (node as Element) : node.parentElement;

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

  async open(target: Element | string, options: LayerOpenOptions = {}): Promise<Layer> {
    const layer = this.get(target);
    if (!layer) {
      throw new TypeError("Layer target could not be resolved or does not identify a native Layer surface.");
    }

    await layer.open(options);
    return layer;
  }

  async ask<T, R = unknown>(
    target: Element | string,
    options: LayerOpenOptions = {},
  ): Promise<LayerOutcome<T, R>> {
    const layer = this.get(target);
    if (!layer) {
      throw new TypeError("Layer target could not be resolved or does not identify a native Layer surface.");
    }

    return layer.ask<T, R>(options);
  }

  get current(): Layer | null {
    return this.activeLayers.at(-1) ?? null;
  }

  get stack(): readonly Layer[] {
    return this.activeLayers.slice();
  }

  initialize(root?: ParentNode): void {
    const target = root ?? getDefaultDocument();
    if (!target) return;

    const document = getOwnerDocument(target);
    if (document) this.installDocumentDismissal(document);

    if (isHTMLElement(target) && target.matches(LAYER_SELECTOR)) {
      this.register(target);
    }

    target.querySelectorAll<HTMLElement>(LAYER_SELECTOR).forEach((element) => {
      this.register(element);
    });
  }

  createOpenContext(
    layer: LayerController,
    trigger: HTMLElement | null | undefined,
    parent: Layer | null | undefined,
    hasExplicitParent: boolean,
  ): LayerOpenContext {
    const resolvedTrigger = trigger === undefined ? getActiveHTMLElement(layer.element) : trigger;
    const resolvedParent = hasExplicitParent
      ? this.resolveExplicitParent(layer, parent ?? null)
      : this.resolveParentFromTrigger(layer, resolvedTrigger);

    return {
      trigger: resolvedTrigger ?? null,
      parent: resolvedParent,
    };
  }

  connect(layer: LayerController, context: LayerOpenContext): void {
    layer.setOpenContext(context);
  }

  activate(layer: LayerController): void {
    if (!this.activeLayers.includes(layer)) this.activeLayers.push(layer);
  }

  deactivate(layer: LayerController): void {
    const activeIndex = this.activeLayers.indexOf(layer);
    if (activeIndex >= 0) this.activeLayers.splice(activeIndex, 1);

    layer.setParent(null);
    layer.detachChildren();
  }

  abortOpening(layer: LayerController): void {
    layer.setParent(null);
  }

  private register(element: HTMLElement): LayerController | undefined {
    const existing = this.registry.get(element);
    if (existing) return existing;

    this.installDocumentDismissal(element.ownerDocument);

    const mode = resolveLayerMode(element);
    if (!mode) return undefined;

    const layer = new LayerController(element, mode, this);
    this.registry.set(element, layer);
    this.registeredLayers.add(layer);

    if (layer.state === "open") this.activate(layer);
    return layer;
  }

  private installDocumentDismissal(document: Document): void {
    if (this.initializedDocuments.has(document)) return;
    document.addEventListener("click", this.handleDocumentClick, true);
    this.initializedDocuments.add(document);
  }

  private readonly handleDocumentClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!isNode(target)) return;

    const document = getNodeDocument(target);
    if (!document) return;

    const modal = this.findTopmostModal(document);
    if (!modal || !isOutsideLayerSurface(event, modal.element, target)) return;

    /*
     * A backdrop click is a global escape from the transient Layer workflow.
     * Consume that click so it cannot activate content exposed underneath while
     * the Layer tree is closing, then close every active Layer in this document.
     */
    event.preventDefault();
    event.stopPropagation();
    void this.closeAllForDocument(document, modal);
  };

  private findTopmostModal(document: Document): LayerController | null {
    for (let index = this.activeLayers.length - 1; index >= 0; index -= 1) {
      const layer = this.activeLayers[index];
      if (layer.element.ownerDocument !== document) continue;
      if (layer.mode !== "modal" && layer.mode !== "drawer") continue;
      if (layer.state === "closed") continue;
      return layer;
    }
    return null;
  }

  private async closeAllForDocument(
    document: Document,
    modal: LayerController,
  ): Promise<void> {
    const active = this.activeLayers.filter((layer) => layer.element.ownerDocument === document);
    if (active.length === 0) return;

    const activeSet = new Set(active);
    const roots = active.filter((layer) => {
      const parent = layer.parent;
      return !(parent instanceof LayerController) || !activeSet.has(parent);
    });

    const focusTarget = findRoot(modal, activeSet).trigger;
    await Promise.all(roots.map((root) => root.close({ restoreFocus: false })));

    if (focusTarget?.isConnected) focusTarget.focus();
  }

  private resolveExplicitParent(layer: LayerController, parent: Layer | null): LayerController | null {
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

  private resolveParentFromTrigger(
    layer: LayerController,
    trigger: HTMLElement | null,
  ): LayerController | null {
    if (!trigger) return null;

    const candidate = this.closest(trigger);
    if (!(candidate instanceof LayerController) || candidate === layer) return null;
    if (candidate.state !== "open" && candidate.state !== "opening") return null;
    return candidate;
  }
}

export const layers = new NativeLayerManager();

/** Register declarative data-mr-layer surfaces within a root. Safe to call repeatedly. */
export function initLayers(root?: ParentNode): void {
  layers.initialize(root);
}

function resolveTarget(target: Element | string): Element | null {
  if (typeof target !== "string") return target;
  return getDefaultDocument()?.querySelector(target) ?? null;
}

function resolveLayerMode(element: HTMLElement): LayerMode | undefined {
  const configuredMode = element.getAttribute("data-mr-layer")?.trim();
  if (configuredMode) {
    if (isLayerMode(configuredMode)) return configuredMode;
    console.warn(`Unknown Markup Refine Layer mode: ${configuredMode}`);
    return undefined;
  }

  if (element.hasAttribute("popover")) return "popover";
  if (element.tagName === "DIALOG") return "modal";
  return undefined;
}

function isLayerMode(value: string): value is LayerMode {
  return LAYER_MODES.includes(value as LayerMode);
}

function getDefaultDocument(): Document | null {
  return typeof document === "undefined" ? null : document;
}

function getOwnerDocument(root: ParentNode): Document | null {
  if (!isNode(root)) return null;
  return root.nodeType === 9 ? (root as Document) : root.ownerDocument;
}

function getNodeDocument(node: Node): Document | null {
  return node.nodeType === 9 ? (node as Document) : node.ownerDocument;
}

function findRoot(
  layer: LayerController,
  active: ReadonlySet<LayerController>,
): LayerController {
  let current = layer;
  while (current.parent instanceof LayerController && active.has(current.parent)) {
    current = current.parent;
  }
  return current;
}

function isOutsideLayerSurface(
  event: MouseEvent,
  surface: HTMLElement,
  target: Node,
): boolean {
  if (target !== surface && surface.contains(target)) return false;

  const bounds = surface.getBoundingClientRect();
  return (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  );
}

function isNode(value: unknown): value is Node {
  return Boolean(
    value &&
      typeof value === "object" &&
      "nodeType" in value
  );
}

function getActiveHTMLElement(surface: HTMLElement): HTMLElement | null {
  const activeElement = surface.ownerDocument.activeElement;
  return isHTMLElement(activeElement) ? activeElement : null;
}

function isHTMLElement(value: unknown): value is HTMLElement {
  return Boolean(
    value &&
      typeof value === "object" &&
      "nodeType" in value &&
      (value as Node).nodeType === 1 &&
      "focus" in value &&
      typeof (value as HTMLElement).focus === "function",
  );
}
