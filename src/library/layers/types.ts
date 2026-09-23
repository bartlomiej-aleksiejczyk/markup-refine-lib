export type LayerMode = "modal" | "drawer" | "popover";

export type LayerState = "closed" | "opening" | "open" | "closing";

export type LayerOutcome<T, R = unknown> =
  | { status: "accepted"; value: T }
  | { status: "dismissed"; reason?: R };

export interface LayerOpenOptions {
  trigger?: HTMLElement | null;
  parent?: Layer | null;
}

export interface LayerCloseOptions {
  restoreFocus?: boolean;
}

export interface Layer {
  readonly element: HTMLElement;
  readonly mode: LayerMode;
  readonly state: LayerState;
  readonly trigger: HTMLElement | null;
  readonly parent: Layer | null;
  readonly children: readonly Layer[];

  open(options?: LayerOpenOptions): Promise<void>;
  close(options?: LayerCloseOptions): Promise<void>;
  accept<T>(value: T): Promise<void>;
  dismiss<R = unknown>(reason?: R): Promise<void>;
  ask<T, R = unknown>(options?: LayerOpenOptions): Promise<LayerOutcome<T, R>>;
}

export interface LayerManager {
  get(target: Element | string): Layer | undefined;
  closest(node: Node): Layer | null;
  open(target: Element | string, options?: LayerOpenOptions): Promise<Layer>;
  ask<T, R = unknown>(
    target: Element | string,
    options?: LayerOpenOptions,
  ): Promise<LayerOutcome<T, R>>;
  readonly current: Layer | null;
  readonly stack: readonly Layer[];
}

export interface LayerLifecycleEventDetail {
  layer: Layer;
}

export interface LayerResultEventDetail<T = unknown, R = unknown> {
  layer: Layer;
  outcome: LayerOutcome<T, R>;
}
