export type TooltipState = "hidden" | "waiting" | "preview" | "pinned";

export interface TooltipOptions {
  /** Delay before a transient preview is shown. */
  showDelay: number;
  /** Time a visible preview remains open before promotion to a pinned popover. */
  pinDelay: number;
  /** Grace period for explicit/focus-based transient hiding. Pointer leave from the trigger cancels an unpinned Tooltip immediately. */
  closeDelay: number;
}

export interface Tooltip {
  readonly trigger: HTMLElement;
  readonly state: TooltipState;

  show(): void;
  hide(): void;
  pin(): void;
  unpin(): void;
}

export interface TooltipRegistry {
  configure(options: Partial<TooltipOptions>): void;
  get(trigger: HTMLElement): Tooltip | null;
  closest(node: Node): Tooltip | null;
  pin(trigger: HTMLElement): void;
  hideAll(): void;
}
