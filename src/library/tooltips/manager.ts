import { TooltipController, resolveTooltipSource, type TooltipHost } from "./tooltip";
import type { Tooltip, TooltipOptions, TooltipRegistry } from "./types";

const TOOLTIP_SELECTOR = "[data-mr-tooltip]";

export const DEFAULT_TOOLTIP_OPTIONS: Readonly<TooltipOptions> = Object.freeze({
  showDelay: 400,
  pinDelay: 1600,
  closeDelay: 250,
});

export class NativeTooltipRegistry implements TooltipRegistry, TooltipHost {
  private readonly registry = new WeakMap<HTMLElement, TooltipController>();
  private readonly registeredTooltips = new Set<TooltipController>();
  private readonly activePreviews: TooltipController[] = [];
  private readonly pinnedTooltips: TooltipController[] = [];
  private readonly initializedDocuments = new WeakSet<Document>();
  private currentOptions: TooltipOptions = { ...DEFAULT_TOOLTIP_OPTIONS };

  get options(): Readonly<TooltipOptions> {
    return this.currentOptions;
  }

  configure(options: Partial<TooltipOptions>): void {
    this.currentOptions = {
      ...this.currentOptions,
      ...validateOptions(options),
    };
  }

  get(trigger: HTMLElement): Tooltip | null {
    const existing = this.registry.get(trigger);
    if (existing) return existing;
    if (!trigger.matches(TOOLTIP_SELECTOR)) return null;
    return this.register(trigger);
  }

  closest(node: Node): Tooltip | null {
    let element: Element | null = node.nodeType === 1
      ? (node as Element)
      : node.parentElement;

    while (element) {
      if (isHTMLElement(element) && element.matches(TOOLTIP_SELECTOR)) {
        return this.get(element);
      }
      element = element.parentElement;
    }

    return null;
  }

  pin(trigger: HTMLElement): void {
    this.get(trigger)?.pin();
  }

  hideAll(): void {
    for (const tooltip of this.registeredTooltips) tooltip.hideNow();
  }

  activatePreview(tooltip: TooltipController): void {
    moveToEnd(this.activePreviews, tooltip);
  }

  deactivatePreview(tooltip: TooltipController): void {
    removeFromList(this.activePreviews, tooltip);
  }

  activatePinned(tooltip: TooltipController): void {
    moveToEnd(this.pinnedTooltips, tooltip);
  }

  deactivatePinned(tooltip: TooltipController): void {
    removeFromList(this.pinnedTooltips, tooltip);
  }

  initialize(root?: ParentNode): void {
    const target = root ?? getDefaultDocument();
    if (!target) return;

    const document = getOwnerDocument(target);
    if (document) this.installDocumentDismissal(document);

    if (isHTMLElement(target) && target.matches(TOOLTIP_SELECTOR)) {
      this.register(target);
    }

    target.querySelectorAll<HTMLElement>(TOOLTIP_SELECTOR).forEach((trigger) => {
      this.register(trigger);
    });
  }

  private register(trigger: HTMLElement): TooltipController | null {
    const existing = this.registry.get(trigger);
    if (existing) return existing;

    const source = resolveTooltipSource(trigger);
    if (!source) {
      console.warn(
        `Markup Refine tooltip source '${trigger.getAttribute("data-mr-tooltip") ?? ""}' could not be resolved.`,
      );
      return null;
    }

    const tooltip = new TooltipController(trigger, source, this);
    this.installDocumentDismissal(trigger.ownerDocument);
    this.registry.set(trigger, tooltip);
    this.registeredTooltips.add(tooltip);
    return tooltip;
  }

  private installDocumentDismissal(document: Document): void {
    if (this.initializedDocuments.has(document)) return;
    document.addEventListener("pointerdown", this.handleDocumentPointerDown, true);
    document.addEventListener("keydown", this.handleDocumentKeyDown, true);
    this.initializedDocuments.add(document);
  }

  private readonly handleDocumentPointerDown = (event: PointerEvent): void => {
    const target = event.target;
    if (!isNode(target)) return;

    const document = getNodeDocument(target);
    if (!document) return;

    const previews = tooltipsForDocument(this.activePreviews, document);
    const pinned = tooltipsForDocument(this.pinnedTooltips, document);
    if (previews.length === 0 && pinned.length === 0) return;

    /*
     * Only the current/topmost Tooltip defines the inside region. Clicking a
     * pinned ancestor while a child Tooltip is current therefore counts as an
     * outside click and dismisses the complete Tooltip stack, matching modal
     * stack dismissal. Text selection/clicks inside the current surface remain
     * ordinary interaction. A transient preview, when present, is current.
     */
    const current = previews.at(-1) ?? pinned.at(-1) ?? null;
    if (current?.ownsInteractionTarget(target)) return;

    for (const tooltip of Array.from(new Set([...previews, ...pinned])).reverse()) {
      tooltip.hideNow();
    }
  };

  private readonly handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;

    const target = event.target;
    const document = isNode(target) ? getNodeDocument(target) : getDefaultDocument();
    if (!document) return;

    /* Let the browser dismiss the topmost native hint preview first. */
    if (findLastForDocument(this.activePreviews, document)) return;

    const current = findLastForDocument(this.pinnedTooltips, document);
    if (!current) return;

    event.preventDefault();
    event.stopPropagation();
    current.dismissPinned(true);
  };
}

export const tooltips = new NativeTooltipRegistry();

/** Register data-mr-tooltip triggers within a root. Safe to call repeatedly. */
export function initTooltips(root?: ParentNode): void {
  tooltips.initialize(root);
}

function validateOptions(options: Partial<TooltipOptions>): Partial<TooltipOptions> {
  const validated: Partial<TooltipOptions> = {};
  for (const key of ["showDelay", "pinDelay", "closeDelay"] as const) {
    const value = options[key];
    if (value === undefined) continue;
    if (!Number.isFinite(value) || value < 0) {
      throw new TypeError(`Tooltip ${key} must be a finite number greater than or equal to zero.`);
    }
    validated[key] = value;
  }
  return validated;
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

function moveToEnd(list: TooltipController[], tooltip: TooltipController): void {
  removeFromList(list, tooltip);
  list.push(tooltip);
}

function removeFromList(list: TooltipController[], tooltip: TooltipController): void {
  const index = list.indexOf(tooltip);
  if (index >= 0) list.splice(index, 1);
}

function tooltipsForDocument(
  list: readonly TooltipController[],
  document: Document,
): TooltipController[] {
  return list.filter((tooltip) => tooltip.trigger.ownerDocument === document);
}

function findLastForDocument(
  list: readonly TooltipController[],
  document: Document,
): TooltipController | null {
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const tooltip = list[index];
    if (tooltip.trigger.ownerDocument === document) return tooltip;
  }
  return null;
}

function isHTMLElement(value: unknown): value is HTMLElement {
  return Boolean(
    value &&
      typeof value === "object" &&
      "nodeType" in value &&
      (value as Node).nodeType === 1 &&
      "matches" in value,
  );
}

function isNode(value: unknown): value is Node {
  return Boolean(value && typeof value === "object" && "nodeType" in value);
}
