import { initLayers, layers } from "../layers/manager";
import type { Layer, LayerOutcome } from "../layers/types";
import type {
  LayerNavigation,
  LayerNavigationAskOptions,
  LayerNavigationErrorDetail,
  LayerNavigationOptions,
  LayerNavigationRequestContext,
  LayerNavigationResultContext,
  LayerNavigationResultDetail,
} from "./types";

const NAVIGATION_ATTRIBUTE = "data-mr-layer-navigation";
const DISMISS_ATTRIBUTE = "data-mr-layer-navigation-dismiss";
const SURFACE_ATTRIBUTE = "data-mr-layer-navigation-surface";
const STATE_ATTRIBUTE = "data-mr-layer-navigation-state";
const PRESERVE_ATTRIBUTE = "data-mr-preserve";

const DEFAULT_LAYER_NAVIGATION_OPTIONS: Readonly<LayerNavigationOptions> = Object.freeze({
  fragmentSelector: "[data-mr-layer-navigation-fragment]",
  resultSelector: "[data-mr-layer-navigation-result]",
  validationStatuses: Object.freeze([400, 422]),
  redirect: "error",
  credentials: "same-origin",
});

type ResolvedOptions = LayerNavigationOptions;

type NavigationRequest = {
  url: URL;
  method: string;
  body?: BodyInit;
  trigger: HTMLElement | null;
  form: HTMLFormElement | null;
  submitter: HTMLElement | null;
};

type ParsedResponse = {
  response: Response;
  document: Document;
  result: LayerOutcome<unknown, unknown> | null;
  fragment: HTMLElement | null;
  validation: boolean;
};

export class LayerNavigationHttpError extends Error {
  readonly response: Response;

  constructor(response: Response) {
    super(`Layer navigation request failed with HTTP ${response.status} ${response.statusText}.`);
    this.name = "LayerNavigationHttpError";
    this.response = response;
  }
}

export class LayerNavigationProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LayerNavigationProtocolError";
  }
}


export function createLayerNavigation(): LayerNavigation {
  return new NativeLayerNavigation();
}

class NativeLayerNavigation implements LayerNavigation {
  private options: LayerNavigationOptions = cloneOptions(DEFAULT_LAYER_NAVIGATION_OPTIONS);
  private readonly initializedRoots = new WeakSet<object>();

  configure(options: Partial<LayerNavigationOptions>): void {
    this.options = mergeOptions(this.options, options);
  }

  async ask<T, R = unknown>(
    askOptions: LayerNavigationAskOptions,
  ): Promise<LayerOutcome<T, R>> {
    const options = mergeOptions(this.options, askOptions);
    const document = askOptions.trigger.ownerDocument;
    const url = resolveUrl(askOptions.url, document.baseURI);
    assertSameOriginUrl(url, document);

    const restoreTriggerBusy = markBusy(askOptions.trigger);
    const initialController = createRequestController(askOptions.signal);

    let parsed: ParsedResponse;
    try {
      parsed = await this.request(
        {
          url,
          method: "GET",
          trigger: askOptions.trigger,
          form: null,
          submitter: null,
        },
        options,
        initialController.signal,
      );
    } finally {
      restoreTriggerBusy();
      initialController.dispose();
    }

    if (parsed.result) {
      return parsed.result as LayerOutcome<T, R>;
    }
    if (!parsed.fragment) {
      throw new LayerNavigationProtocolError(
        `Remote HTML did not contain a fragment matching '${options.fragmentSelector}'.`,
      );
    }

    const surface = createSurface(document);
    const layer = layers.get(surface);
    if (!layer) {
      surface.remove();
      throw new LayerNavigationProtocolError("The generated remote surface could not be registered as a Layer.");
    }

    const session = new RemoteLayerSession(layer, surface, options, askOptions.signal, (request, signal) =>
      this.request(request, options, signal),
    );

    document.body.append(surface);
    initLayers(surface);

    try {
      session.render(parsed);
      return await layer.ask<T, R>({
        trigger: askOptions.trigger,
        ...(Object.prototype.hasOwnProperty.call(askOptions, "parent")
          ? { parent: askOptions.parent ?? null }
          : {}),
      });
    } finally {
      session.destroy();
      surface.remove();
    }
  }

  initialize(root?: ParentNode): void {
    const target = root ?? (typeof document !== "undefined" ? document : null);
    if (!target || this.initializedRoots.has(target as object)) return;
    const eventTarget = target as ParentNode & EventTarget;
    eventTarget.addEventListener("click", this.handleEnhancedLinkClick as EventListener);
    this.initializedRoots.add(target as object);
  }

  private readonly handleEnhancedLinkClick = (event: MouseEvent): void => {
    const anchor = findEnhancedAnchor(event);
    if (!anchor) return;

    const url = resolveUrl(anchor.href, anchor.ownerDocument.baseURI);
    if (!isSameOriginUrl(url, anchor.ownerDocument)) return;

    event.preventDefault();
    void this.ask({ url, trigger: anchor })
      .then((outcome) => {
        dispatchNavigationResult(anchor, url, outcome);
      })
      .catch((error) => {
        dispatchNavigationError(anchor, {
          error,
          url,
          response: error instanceof LayerNavigationHttpError ? error.response : null,
          surface: null,
        });
        navigateFallback(anchor, url);
      });
  };

  private async request(
    request: NavigationRequest,
    options: ResolvedOptions,
    signal: AbortSignal,
  ): Promise<ParsedResponse> {
    const requestDocument = request.trigger?.ownerDocument ?? request.form?.ownerDocument ?? getDefaultDocument();
    assertSameOriginUrl(request.url, requestDocument);

    const context: LayerNavigationRequestContext = {
      url: request.url,
      method: request.method,
      trigger: request.trigger,
      form: request.form,
      submitter: request.submitter,
    };
    const headers = new Headers(resolveHeaders(options.requestHeaders, context));
    if (!headers.has("Accept")) headers.set("Accept", "text/html");
    if (isFormDataBody(request.body)) headers.delete("Content-Type");

    const response = await fetch(request.url, {
      method: request.method,
      body: request.body,
      headers,
      signal,
      credentials: options.credentials,
      redirect: options.redirect,
    });

    if (response.redirected) {
      const finalUrl = resolveUrl(response.url, request.url.href);
      assertSameOriginUrl(finalUrl, requestDocument);
    }

    const validation = options.validationStatuses.includes(response.status);
    if (!response.ok && !validation) throw new LayerNavigationHttpError(response);

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new LayerNavigationProtocolError(
        `Layer navigation requires an HTML response; received '${contentType || "unknown"}'.`,
      );
    }

    const html = await response.text();
    const ownerDocument = requestDocument;
    const DOMParserConstructor = ownerDocument?.defaultView?.DOMParser ?? globalThis.DOMParser;
    if (!DOMParserConstructor) {
      throw new LayerNavigationProtocolError("DOMParser is unavailable in this environment.");
    }

    const parsedDocument = new DOMParserConstructor().parseFromString(html, "text/html");
    const marker = parsedDocument.querySelector<HTMLElement>(options.resultSelector);
    const result = marker
      ? parseServerResult({ response, document: parsedDocument, marker }, options)
      : null;
    const fragment = parsedDocument.querySelector<HTMLElement>(options.fragmentSelector);

    if (fragment) {
      prepareRemoteFragment(fragment);
      normalizeNavigationUrls(fragment, response.url || request.url.href);
    }

    return { response, document: parsedDocument, result, fragment, validation };
  }
}

export const layerNavigation = createLayerNavigation();

/**
 * Opt in to declarative enhancement of semantic
 * `a[data-mr-layer-navigation][href]` links within a root.
 *
 * This is intentionally not part of the default behaviors bundle.
 */
export function initLayerNavigation(root?: ParentNode): void {
  layerNavigation.initialize(root);
}

class RemoteLayerSession {
  private activeController: AbortController | null = null;
  private removeAbortListener: (() => void) | null = null;
  private destroyed = false;

  constructor(
    private readonly layer: Layer,
    private readonly surface: HTMLElement,
    private readonly options: ResolvedOptions,
    externalSignal: AbortSignal | undefined,
    private readonly performRequest: (
      request: NavigationRequest,
      signal: AbortSignal,
    ) => Promise<ParsedResponse>,
  ) {
    surface.addEventListener("click", this.handleClick);
    surface.addEventListener("submit", this.handleSubmit);
    surface.addEventListener("mr:layer:close", this.handleClose);

    if (externalSignal) {
      const onAbort = () => {
        this.activeController?.abort(externalSignal.reason);
        void this.layer.close();
      };
      externalSignal.addEventListener("abort", onAbort, { once: true });
      this.removeAbortListener = () => externalSignal.removeEventListener("abort", onAbort);
    }
  }

  render(parsed: ParsedResponse): void {
    if (!parsed.fragment) return;
    const imported = this.surface.ownerDocument.importNode(parsed.fragment, true);
    if (parsed.validation) preserveMarkedNodes(this.surface, imported);
    this.surface.replaceChildren(imported);
    initLayers(imported);
    this.surface.setAttribute(STATE_ATTRIBUTE, parsed.validation ? "validation" : "ready");
    this.surface.removeAttribute("aria-busy");

    this.options.onRender?.({
      response: parsed.response,
      fragment: imported,
      surface: this.surface,
      validation: parsed.validation,
    });

    if (parsed.validation) focusValidationTarget(imported);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.activeController?.abort();
    this.removeAbortListener?.();
    this.surface.removeEventListener("click", this.handleClick);
    this.surface.removeEventListener("submit", this.handleSubmit);
    this.surface.removeEventListener("mr:layer:close", this.handleClose);
  }

  private readonly handleClose = (): void => {
    this.activeController?.abort();
  };

  private readonly handleClick = (event: MouseEvent): void => {
    if (event.defaultPrevented) return;

    const dismiss = closestWithin<HTMLElement>(event.target, `[${DISMISS_ATTRIBUTE}]`, this.surface);
    if (dismiss) {
      event.preventDefault();
      void this.layer.dismiss();
      return;
    }

    const anchor = findEnhancedAnchor(event, this.surface);
    if (!anchor) return;

    const url = resolveUrl(anchor.href, this.surface.ownerDocument.baseURI);
    if (!isSameOriginUrl(url, this.surface.ownerDocument)) return;

    event.preventDefault();
    void this.navigate({
      url,
      method: "GET",
      trigger: anchor,
      form: null,
      submitter: null,
    });
  };

  private readonly handleSubmit = (event: SubmitEvent): void => {
    if (event.defaultPrevented) return;
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.hasAttribute(NAVIGATION_ATTRIBUTE)) return;

    const request = buildFormRequest(form, event.submitter);
    if (!request) return;

    event.preventDefault();
    void this.navigate(request);
  };

  private async navigate(request: NavigationRequest): Promise<void> {
    this.activeController?.abort();
    const controller = new AbortController();
    this.activeController = controller;
    this.surface.setAttribute("aria-busy", "true");
    this.surface.setAttribute(STATE_ATTRIBUTE, "loading");

    try {
      const parsed = await this.performRequest(request, controller.signal);
      if (this.activeController !== controller) return;

      if (parsed.result) {
        if (parsed.result.status === "accepted") {
          await this.layer.accept(parsed.result.value);
        } else {
          await this.layer.dismiss(parsed.result.reason);
        }
        return;
      }

      if (!parsed.fragment) {
        throw new LayerNavigationProtocolError(
          `Remote HTML did not contain a fragment matching '${this.options.fragmentSelector}'.`,
        );
      }
      this.render(parsed);
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) return;
      this.surface.removeAttribute("aria-busy");
      this.surface.setAttribute(STATE_ATTRIBUTE, "error");
      dispatchNavigationError(this.surface, {
        error,
        url: request.url,
        response: error instanceof LayerNavigationHttpError ? error.response : null,
        surface: this.surface,
      });
    } finally {
      if (this.activeController === controller) this.activeController = null;
    }
  }
}

function createSurface(document: Document): HTMLDialogElement {
  const surface = document.createElement("dialog");
  surface.setAttribute("data-mr-layer", "modal");
  surface.setAttribute(SURFACE_ATTRIBUTE, "");
  surface.setAttribute(STATE_ATTRIBUTE, "ready");
  surface.classList.add("mr-layer", "mr-layer--modal", "mr-layer-navigation");
  return surface;
}

function buildFormRequest(
  form: HTMLFormElement,
  submitter: HTMLElement | null,
): NavigationRequest | null {
  const submitControl = isSubmitControl(submitter) ? submitter : null;
  const method = (submitControl?.formMethod || form.method || "get").toUpperCase();
  if (method === "DIALOG") return null;

  const target = submitControl?.formTarget || form.target;
  if (target && target.toLowerCase() !== "_self") return null;

  const enctype = (submitControl?.formEnctype || form.enctype || "application/x-www-form-urlencoded").toLowerCase();

  const action = submitControl?.formAction || form.action || form.ownerDocument.location?.href;
  if (!action) return null;
  const url = resolveUrl(action, form.ownerDocument.baseURI);
  if (!isSameOriginUrl(url, form.ownerDocument)) return null;

  const formData = submitControl
    ? new FormData(form, submitControl)
    : new FormData(form);

  if (method === "GET") {
    const encoded = encodeStringFormData(formData);
    if (!encoded) return null;
    for (const [name, value] of encoded) url.searchParams.append(name, value);
    return { url, method, trigger: submitter, form, submitter };
  }

  if (enctype === "multipart/form-data") {
    return {
      url,
      method,
      body: formData,
      trigger: submitter,
      form,
      submitter,
    };
  }

  if (enctype !== "application/x-www-form-urlencoded") return null;

  const encoded = encodeStringFormData(formData);
  if (!encoded) return null;

  return {
    url,
    method,
    body: encoded,
    trigger: submitter,
    form,
    submitter,
  };
}

function parseServerResult(
  context: LayerNavigationResultContext,
  options: ResolvedOptions,
): LayerOutcome<unknown, unknown> | null {
  if (options.parseResult) return options.parseResult(context);

  const status = context.marker.getAttribute("data-mr-layer-navigation-result")?.trim();
  if (status !== "accepted" && status !== "dismissed") {
    throw new LayerNavigationProtocolError(
      "Server result marker must declare data-mr-layer-navigation-result=\"accepted\" or \"dismissed\".",
    );
  }

  const raw = context.marker.textContent?.trim() ?? "";
  let payload: unknown = undefined;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      throw new LayerNavigationProtocolError(
        `Server result payload is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return status === "accepted"
    ? { status: "accepted", value: payload }
    : payload === undefined
      ? { status: "dismissed" }
      : { status: "dismissed", reason: payload };
}

function mergeOptions(
  base: LayerNavigationOptions,
  override: Partial<LayerNavigationOptions>,
): LayerNavigationOptions {
  return {
    ...base,
    ...override,
    validationStatuses: override.validationStatuses
      ? [...override.validationStatuses]
      : [...base.validationStatuses],
  };
}

function cloneOptions(options: Readonly<LayerNavigationOptions>): LayerNavigationOptions {
  return mergeOptions(options as LayerNavigationOptions, {});
}

function resolveHeaders(
  configured: LayerNavigationOptions["requestHeaders"],
  context: LayerNavigationRequestContext,
): HeadersInit | undefined {
  return typeof configured === "function" ? configured(context) : configured;
}

function resolveUrl(value: string | URL, base: string): URL {
  return value instanceof URL ? new URL(value.href) : new URL(value, base);
}

function assertSameOriginUrl(url: URL, document: Document | null): void {
  if (!isSameOriginUrl(url, document)) {
    throw new LayerNavigationProtocolError(
      `Layer navigation requires a same-origin HTTP(S) URL; received '${url.href}'.`,
    );
  }
}

function isSameOriginUrl(url: URL, document: Document | null): boolean {
  if (!/^https?:$/.test(url.protocol)) return false;

  const origin = document?.location?.origin;
  if (!origin || origin === "null") return false;
  return url.origin === origin;
}

function getDefaultDocument(): Document | null {
  return typeof document === "undefined" ? null : document;
}

function prepareRemoteFragment(fragment: HTMLElement): void {
  fragment.querySelectorAll("script").forEach((script) => script.remove());

  const elements = [fragment, ...Array.from(fragment.querySelectorAll<HTMLElement>("*"))];
  for (const element of elements) {
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name.toLowerCase().startsWith("on")) {
        element.removeAttribute(attribute.name);
        continue;
      }

      if (["href", "src", "action", "formaction"].includes(attribute.name.toLowerCase())) {
        const value = attribute.value.trim().toLowerCase();
        if (value.startsWith("javascript:")) element.removeAttribute(attribute.name);
      }
    }
  }
}

function normalizeNavigationUrls(fragment: HTMLElement, baseUrl: string): void {
  const mappings: ReadonlyArray<readonly [string, string]> = [
    ["a[href]", "href"],
    ["form[action]", "action"],
    ["button[formaction]", "formaction"],
    ["input[formaction]", "formaction"],
  ];

  for (const [selector, attribute] of mappings) {
    const elements = [
      ...(fragment.matches(selector) ? [fragment] : []),
      ...Array.from(fragment.querySelectorAll<HTMLElement>(selector)),
    ];
    for (const element of elements) {
      const value = element.getAttribute(attribute);
      if (!value || value.startsWith("#")) continue;
      try {
        element.setAttribute(attribute, new URL(value, baseUrl).href);
      } catch {
        // Preserve malformed/non-URL author input; native fallback will handle it.
      }
    }
  }
}

function findEnhancedAnchor(event: MouseEvent, boundary?: HTMLElement): HTMLAnchorElement | null {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return null;
  }

  const anchor = closestWithin<HTMLAnchorElement>(
    event.target,
    `a[${NAVIGATION_ATTRIBUTE}][href]`,
    boundary,
  );
  if (!anchor || anchor.hasAttribute("download")) return null;

  const target = anchor.target.trim().toLowerCase();
  if (target && target !== "_self") return null;
  return anchor;
}

function closestWithin<T extends Element>(
  target: EventTarget | null,
  selector: string,
  boundary?: HTMLElement,
): T | null {
  if (!(target instanceof Element)) return null;
  const match = target.closest<T>(selector);
  if (!match) return null;
  if (boundary && !boundary.contains(match)) return null;
  return match;
}

function isSubmitControl(value: HTMLElement | null): value is HTMLButtonElement | HTMLInputElement {
  if (value instanceof HTMLButtonElement) return value.type === "submit";
  if (value instanceof HTMLInputElement) return value.type === "submit" || value.type === "image";
  return false;
}

function encodeStringFormData(formData: FormData): URLSearchParams | null {
  const encoded = new URLSearchParams();
  for (const [name, value] of formData) {
    if (typeof value !== "string") return null;
    encoded.append(name, value);
  }
  return encoded;
}

function isFormDataBody(body: BodyInit | undefined): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function preserveMarkedNodes(current: HTMLElement, incoming: HTMLElement): void {
  const existingById = new Map<string, HTMLElement>();
  const currentCandidates = Array.from(
    current.querySelectorAll<HTMLElement>(`[${PRESERVE_ATTRIBUTE}][id]`),
  );
  for (const element of currentCandidates) {
    if (element.id && !existingById.has(element.id)) existingById.set(element.id, element);
  }

  const incomingCandidates = Array.from(
    incoming.querySelectorAll<HTMLElement>(`[${PRESERVE_ATTRIBUTE}][id]`),
  );
  for (const replacement of incomingCandidates) {
    const existing = existingById.get(replacement.id);
    if (!existing || !canPreserveNode(existing, replacement)) continue;
    syncPreservedAttributes(existing, replacement);
    replacement.replaceWith(existing);
  }
}

function canPreserveNode(existing: HTMLElement, replacement: HTMLElement): boolean {
  if (existing.tagName !== replacement.tagName) return false;
  if (isInputElement(existing) && isInputElement(replacement)) {
    return existing.type === replacement.type;
  }
  return true;
}

function syncPreservedAttributes(existing: HTMLElement, replacement: HTMLElement): void {
  const replacementNames = new Set(Array.from(replacement.attributes, (attribute) => attribute.name));
  for (const attribute of Array.from(existing.attributes)) {
    if (!replacementNames.has(attribute.name)) existing.removeAttribute(attribute.name);
  }
  for (const attribute of Array.from(replacement.attributes)) {
    if (attribute.name.toLowerCase() === "value" && isInputElement(existing) && existing.type === "file") {
      continue;
    }
    existing.setAttribute(attribute.name, attribute.value);
  }
}

function isInputElement(element: HTMLElement): element is HTMLInputElement {
  return element.tagName === "INPUT";
}

function focusValidationTarget(fragment: HTMLElement): void {
  const target = fragment.querySelector<HTMLElement>(
    "[autofocus], [aria-invalid=\"true\"], input:invalid, select:invalid, textarea:invalid",
  );
  target?.focus();
}

function createRequestController(externalSignal?: AbortSignal): {
  signal: AbortSignal;
  dispose: () => void;
} {
  const controller = new AbortController();
  if (!externalSignal) return { signal: controller.signal, dispose: () => undefined };

  if (externalSignal.aborted) controller.abort(externalSignal.reason);
  const onAbort = () => controller.abort(externalSignal.reason);
  externalSignal.addEventListener("abort", onAbort, { once: true });

  return {
    signal: controller.signal,
    dispose: () => externalSignal.removeEventListener("abort", onAbort),
  };
}

function markBusy(element: HTMLElement): () => void {
  const previous = element.getAttribute("aria-busy");
  element.setAttribute("aria-busy", "true");
  return () => {
    if (previous === null) element.removeAttribute("aria-busy");
    else element.setAttribute("aria-busy", previous);
  };
}

function dispatchNavigationError(target: EventTarget, detail: LayerNavigationErrorDetail): void {
  const document = target instanceof Node ? target.ownerDocument : getDefaultDocument();
  const CustomEventConstructor = document?.defaultView?.CustomEvent ?? globalThis.CustomEvent;
  target.dispatchEvent(
    new CustomEventConstructor<LayerNavigationErrorDetail>("mr:layer-navigation:error", {
      bubbles: true,
      detail,
    }),
  );
}

function dispatchNavigationResult<T, R>(
  target: HTMLElement,
  url: URL,
  outcome: LayerOutcome<T, R>,
): void {
  const CustomEventConstructor = target.ownerDocument.defaultView?.CustomEvent ?? globalThis.CustomEvent;
  const detail: LayerNavigationResultDetail<T, R> = { outcome, url };
  target.dispatchEvent(
    new CustomEventConstructor<LayerNavigationResultDetail<T, R>>("mr:layer-navigation:result", {
      bubbles: true,
      detail,
    }),
  );
}

function navigateFallback(anchor: HTMLAnchorElement, url: URL): void {
  anchor.ownerDocument.defaultView?.location.assign(url.href);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
