import type { Layer, LayerOutcome } from "../layers/types";

export type LayerNavigationRedirectMode = "error" | "follow";


export interface LayerNavigationRequestContext {
  readonly url: URL;
  readonly method: string;
  readonly trigger: HTMLElement | null;
  readonly form: HTMLFormElement | null;
  readonly submitter: HTMLElement | null;
}

export interface LayerNavigationResultContext {
  readonly response: Response;
  readonly document: Document;
  readonly marker: HTMLElement;
}

export interface LayerNavigationRenderContext {
  readonly response: Response;
  readonly fragment: HTMLElement;
  readonly surface: HTMLElement;
  readonly validation: boolean;
}

export interface LayerNavigationOptions {
  fragmentSelector: string;
  resultSelector: string;
  validationStatuses: readonly number[];
  redirect: LayerNavigationRedirectMode;
  credentials: RequestCredentials;
  requestHeaders?:
    | HeadersInit
    | ((context: LayerNavigationRequestContext) => HeadersInit | undefined);
  parseResult?: (
    context: LayerNavigationResultContext,
  ) => LayerOutcome<unknown, unknown> | null;
  onRender?: (context: LayerNavigationRenderContext) => void;
}

export interface LayerNavigationAskOptions extends Partial<LayerNavigationOptions> {
  url: string | URL;
  trigger: HTMLElement;
  parent?: Layer | null;
  signal?: AbortSignal;
}

export interface LayerNavigationErrorDetail {
  readonly error: unknown;
  readonly url: URL;
  readonly response: Response | null;
  readonly surface: HTMLElement | null;
}

export interface LayerNavigationResultDetail<T = unknown, R = unknown> {
  readonly outcome: LayerOutcome<T, R>;
  readonly url: URL;
}

export interface LayerNavigation {
  configure(options: Partial<LayerNavigationOptions>): void;
  ask<T, R = unknown>(
    options: LayerNavigationAskOptions,
  ): Promise<LayerOutcome<T, R>>;
  initialize(root?: ParentNode): void;
}

