var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { layers, initLayers } from "./markup-refine-lib-layers.js";
const NAVIGATION_ATTRIBUTE = "data-mr-layer-navigation";
const DISMISS_ATTRIBUTE = "data-mr-layer-navigation-dismiss";
const SURFACE_ATTRIBUTE = "data-mr-layer-navigation-surface";
const STATE_ATTRIBUTE = "data-mr-layer-navigation-state";
const PRESERVE_ATTRIBUTE = "data-mr-preserve";
const DEFAULT_LAYER_NAVIGATION_OPTIONS = Object.freeze({
  fragmentSelector: "[data-mr-layer-navigation-fragment]",
  resultSelector: "[data-mr-layer-navigation-result]",
  validationStatuses: Object.freeze([400, 422]),
  redirect: "error",
  credentials: "same-origin"
});
class LayerNavigationHttpError extends Error {
  constructor(response) {
    super(`Layer navigation request failed with HTTP ${response.status} ${response.statusText}.`);
    __publicField(this, "response");
    this.name = "LayerNavigationHttpError";
    this.response = response;
  }
}
class LayerNavigationProtocolError extends Error {
  constructor(message) {
    super(message);
    this.name = "LayerNavigationProtocolError";
  }
}
function createLayerNavigation() {
  return new NativeLayerNavigation();
}
class NativeLayerNavigation {
  constructor() {
    __publicField(this, "options", cloneOptions(DEFAULT_LAYER_NAVIGATION_OPTIONS));
    __publicField(this, "initializedRoots", /* @__PURE__ */ new WeakSet());
    __publicField(this, "handleEnhancedLinkClick", (event) => {
      const anchor = findEnhancedAnchor(event);
      if (!anchor) return;
      const url = resolveUrl(anchor.href, anchor.ownerDocument.baseURI);
      if (!isSameOriginUrl(url, anchor.ownerDocument)) return;
      event.preventDefault();
      void this.ask({ url, trigger: anchor }).then((outcome) => {
        dispatchNavigationResult(anchor, url, outcome);
      }).catch((error) => {
        dispatchNavigationError(anchor, {
          error,
          url,
          response: error instanceof LayerNavigationHttpError ? error.response : null,
          surface: null
        });
        navigateFallback(anchor, url);
      });
    });
  }
  configure(options) {
    this.options = mergeOptions(this.options, options);
  }
  async ask(askOptions) {
    const options = mergeOptions(this.options, askOptions);
    const document2 = askOptions.trigger.ownerDocument;
    const url = resolveUrl(askOptions.url, document2.baseURI);
    assertSameOriginUrl(url, document2);
    const restoreTriggerBusy = markBusy(askOptions.trigger);
    const initialController = createRequestController(askOptions.signal);
    let parsed;
    try {
      parsed = await this.request(
        {
          url,
          method: "GET",
          trigger: askOptions.trigger,
          form: null,
          submitter: null
        },
        options,
        initialController.signal
      );
    } finally {
      restoreTriggerBusy();
      initialController.dispose();
    }
    if (parsed.result) {
      return parsed.result;
    }
    if (!parsed.fragment) {
      throw new LayerNavigationProtocolError(
        `Remote HTML did not contain a fragment matching '${options.fragmentSelector}'.`
      );
    }
    const surface = createSurface(document2);
    const layer = layers.get(surface);
    if (!layer) {
      surface.remove();
      throw new LayerNavigationProtocolError("The generated remote surface could not be registered as a Layer.");
    }
    const session = new RemoteLayerSession(
      layer,
      surface,
      options,
      askOptions.signal,
      (request, signal) => this.request(request, options, signal)
    );
    document2.body.append(surface);
    initLayers(surface);
    try {
      session.render(parsed);
      return await layer.ask({
        trigger: askOptions.trigger,
        ...Object.prototype.hasOwnProperty.call(askOptions, "parent") ? { parent: askOptions.parent ?? null } : {}
      });
    } finally {
      session.destroy();
      surface.remove();
    }
  }
  initialize(root) {
    const target = root ?? (typeof document !== "undefined" ? document : null);
    if (!target || this.initializedRoots.has(target)) return;
    const eventTarget = target;
    eventTarget.addEventListener("click", this.handleEnhancedLinkClick);
    this.initializedRoots.add(target);
  }
  async request(request, options, signal) {
    var _a, _b, _c, _d;
    const requestDocument = ((_a = request.trigger) == null ? void 0 : _a.ownerDocument) ?? ((_b = request.form) == null ? void 0 : _b.ownerDocument) ?? getDefaultDocument();
    assertSameOriginUrl(request.url, requestDocument);
    const context = {
      url: request.url,
      method: request.method,
      trigger: request.trigger,
      form: request.form,
      submitter: request.submitter
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
      redirect: options.redirect
    });
    if (response.redirected) {
      const finalUrl = resolveUrl(response.url, request.url.href);
      assertSameOriginUrl(finalUrl, requestDocument);
    }
    const validation = options.validationStatuses.includes(response.status);
    if (!response.ok && !validation) throw new LayerNavigationHttpError(response);
    const contentType = ((_c = response.headers.get("content-type")) == null ? void 0 : _c.toLowerCase()) ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new LayerNavigationProtocolError(
        `Layer navigation requires an HTML response; received '${contentType || "unknown"}'.`
      );
    }
    const html = await response.text();
    const ownerDocument = requestDocument;
    const DOMParserConstructor = ((_d = ownerDocument == null ? void 0 : ownerDocument.defaultView) == null ? void 0 : _d.DOMParser) ?? globalThis.DOMParser;
    if (!DOMParserConstructor) {
      throw new LayerNavigationProtocolError("DOMParser is unavailable in this environment.");
    }
    const parsedDocument = new DOMParserConstructor().parseFromString(html, "text/html");
    const marker = parsedDocument.querySelector(options.resultSelector);
    const result = marker ? parseServerResult({ response, document: parsedDocument, marker }, options) : null;
    const fragment = parsedDocument.querySelector(options.fragmentSelector);
    if (fragment) {
      prepareRemoteFragment(fragment);
      normalizeNavigationUrls(fragment, response.url || request.url.href);
    }
    return { response, document: parsedDocument, result, fragment, validation };
  }
}
const layerNavigation = createLayerNavigation();
function initLayerNavigation(root) {
  layerNavigation.initialize(root);
}
class RemoteLayerSession {
  constructor(layer, surface, options, externalSignal, performRequest) {
    __publicField(this, "activeController", null);
    __publicField(this, "removeAbortListener", null);
    __publicField(this, "destroyed", false);
    __publicField(this, "handleClose", () => {
      var _a;
      (_a = this.activeController) == null ? void 0 : _a.abort();
    });
    __publicField(this, "handleClick", (event) => {
      if (event.defaultPrevented) return;
      const dismiss = closestWithin(event.target, `[${DISMISS_ATTRIBUTE}]`, this.surface);
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
        submitter: null
      });
    });
    __publicField(this, "handleSubmit", (event) => {
      if (event.defaultPrevented) return;
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.hasAttribute(NAVIGATION_ATTRIBUTE)) return;
      const request = buildFormRequest(form, event.submitter);
      if (!request) return;
      event.preventDefault();
      void this.navigate(request);
    });
    this.layer = layer;
    this.surface = surface;
    this.options = options;
    this.performRequest = performRequest;
    surface.addEventListener("click", this.handleClick);
    surface.addEventListener("submit", this.handleSubmit);
    surface.addEventListener("mr:layer:close", this.handleClose);
    if (externalSignal) {
      const onAbort = () => {
        var _a;
        (_a = this.activeController) == null ? void 0 : _a.abort(externalSignal.reason);
        void this.layer.close();
      };
      externalSignal.addEventListener("abort", onAbort, { once: true });
      this.removeAbortListener = () => externalSignal.removeEventListener("abort", onAbort);
    }
  }
  render(parsed) {
    var _a, _b;
    if (!parsed.fragment) return;
    const imported = this.surface.ownerDocument.importNode(parsed.fragment, true);
    if (parsed.validation) preserveMarkedNodes(this.surface, imported);
    this.surface.replaceChildren(imported);
    initLayers(imported);
    this.surface.setAttribute(STATE_ATTRIBUTE, parsed.validation ? "validation" : "ready");
    this.surface.removeAttribute("aria-busy");
    (_b = (_a = this.options).onRender) == null ? void 0 : _b.call(_a, {
      response: parsed.response,
      fragment: imported,
      surface: this.surface,
      validation: parsed.validation
    });
    if (parsed.validation) focusValidationTarget(imported);
  }
  destroy() {
    var _a, _b;
    if (this.destroyed) return;
    this.destroyed = true;
    (_a = this.activeController) == null ? void 0 : _a.abort();
    (_b = this.removeAbortListener) == null ? void 0 : _b.call(this);
    this.surface.removeEventListener("click", this.handleClick);
    this.surface.removeEventListener("submit", this.handleSubmit);
    this.surface.removeEventListener("mr:layer:close", this.handleClose);
  }
  async navigate(request) {
    var _a;
    (_a = this.activeController) == null ? void 0 : _a.abort();
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
          `Remote HTML did not contain a fragment matching '${this.options.fragmentSelector}'.`
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
        surface: this.surface
      });
    } finally {
      if (this.activeController === controller) this.activeController = null;
    }
  }
}
function createSurface(document2) {
  const surface = document2.createElement("dialog");
  surface.setAttribute("data-mr-layer", "modal");
  surface.setAttribute(SURFACE_ATTRIBUTE, "");
  surface.setAttribute(STATE_ATTRIBUTE, "ready");
  surface.classList.add("mr-layer", "mr-layer--modal", "mr-layer-navigation");
  return surface;
}
function buildFormRequest(form, submitter) {
  var _a;
  const submitControl = isSubmitControl(submitter) ? submitter : null;
  const method = ((submitControl == null ? void 0 : submitControl.formMethod) || form.method || "get").toUpperCase();
  if (method === "DIALOG") return null;
  const target = (submitControl == null ? void 0 : submitControl.formTarget) || form.target;
  if (target && target.toLowerCase() !== "_self") return null;
  const enctype = ((submitControl == null ? void 0 : submitControl.formEnctype) || form.enctype || "application/x-www-form-urlencoded").toLowerCase();
  const action = (submitControl == null ? void 0 : submitControl.formAction) || form.action || ((_a = form.ownerDocument.location) == null ? void 0 : _a.href);
  if (!action) return null;
  const url = resolveUrl(action, form.ownerDocument.baseURI);
  if (!isSameOriginUrl(url, form.ownerDocument)) return null;
  const formData = submitControl ? new FormData(form, submitControl) : new FormData(form);
  if (method === "GET") {
    const encoded2 = encodeStringFormData(formData);
    if (!encoded2) return null;
    for (const [name, value] of encoded2) url.searchParams.append(name, value);
    return { url, method, trigger: submitter, form, submitter };
  }
  if (enctype === "multipart/form-data") {
    return {
      url,
      method,
      body: formData,
      trigger: submitter,
      form,
      submitter
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
    submitter
  };
}
function parseServerResult(context, options) {
  var _a, _b;
  if (options.parseResult) return options.parseResult(context);
  const status = (_a = context.marker.getAttribute("data-mr-layer-navigation-result")) == null ? void 0 : _a.trim();
  if (status !== "accepted" && status !== "dismissed") {
    throw new LayerNavigationProtocolError(
      'Server result marker must declare data-mr-layer-navigation-result="accepted" or "dismissed".'
    );
  }
  const raw = ((_b = context.marker.textContent) == null ? void 0 : _b.trim()) ?? "";
  let payload = void 0;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      throw new LayerNavigationProtocolError(
        `Server result payload is not valid JSON: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  return status === "accepted" ? { status: "accepted", value: payload } : payload === void 0 ? { status: "dismissed" } : { status: "dismissed", reason: payload };
}
function mergeOptions(base, override) {
  return {
    ...base,
    ...override,
    validationStatuses: override.validationStatuses ? [...override.validationStatuses] : [...base.validationStatuses]
  };
}
function cloneOptions(options) {
  return mergeOptions(options, {});
}
function resolveHeaders(configured, context) {
  return typeof configured === "function" ? configured(context) : configured;
}
function resolveUrl(value, base) {
  return value instanceof URL ? new URL(value.href) : new URL(value, base);
}
function assertSameOriginUrl(url, document2) {
  if (!isSameOriginUrl(url, document2)) {
    throw new LayerNavigationProtocolError(
      `Layer navigation requires a same-origin HTTP(S) URL; received '${url.href}'.`
    );
  }
}
function isSameOriginUrl(url, document2) {
  var _a;
  if (!/^https?:$/.test(url.protocol)) return false;
  const origin = (_a = document2 == null ? void 0 : document2.location) == null ? void 0 : _a.origin;
  if (!origin || origin === "null") return false;
  return url.origin === origin;
}
function getDefaultDocument() {
  return typeof document === "undefined" ? null : document;
}
function prepareRemoteFragment(fragment) {
  fragment.querySelectorAll("script").forEach((script) => script.remove());
  const elements = [fragment, ...Array.from(fragment.querySelectorAll("*"))];
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
function normalizeNavigationUrls(fragment, baseUrl) {
  const mappings = [
    ["a[href]", "href"],
    ["form[action]", "action"],
    ["button[formaction]", "formaction"],
    ["input[formaction]", "formaction"]
  ];
  for (const [selector, attribute] of mappings) {
    const elements = [
      ...fragment.matches(selector) ? [fragment] : [],
      ...Array.from(fragment.querySelectorAll(selector))
    ];
    for (const element of elements) {
      const value = element.getAttribute(attribute);
      if (!value || value.startsWith("#")) continue;
      try {
        element.setAttribute(attribute, new URL(value, baseUrl).href);
      } catch {
      }
    }
  }
}
function findEnhancedAnchor(event, boundary) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return null;
  }
  const anchor = closestWithin(
    event.target,
    `a[${NAVIGATION_ATTRIBUTE}][href]`,
    boundary
  );
  if (!anchor || anchor.hasAttribute("download")) return null;
  const target = anchor.target.trim().toLowerCase();
  if (target && target !== "_self") return null;
  return anchor;
}
function closestWithin(target, selector, boundary) {
  if (!(target instanceof Element)) return null;
  const match = target.closest(selector);
  if (!match) return null;
  if (boundary && !boundary.contains(match)) return null;
  return match;
}
function isSubmitControl(value) {
  if (value instanceof HTMLButtonElement) return value.type === "submit";
  if (value instanceof HTMLInputElement) return value.type === "submit" || value.type === "image";
  return false;
}
function encodeStringFormData(formData) {
  const encoded = new URLSearchParams();
  for (const [name, value] of formData) {
    if (typeof value !== "string") return null;
    encoded.append(name, value);
  }
  return encoded;
}
function isFormDataBody(body) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}
function preserveMarkedNodes(current, incoming) {
  const existingById = /* @__PURE__ */ new Map();
  const currentCandidates = Array.from(
    current.querySelectorAll(`[${PRESERVE_ATTRIBUTE}][id]`)
  );
  for (const element of currentCandidates) {
    if (element.id && !existingById.has(element.id)) existingById.set(element.id, element);
  }
  const incomingCandidates = Array.from(
    incoming.querySelectorAll(`[${PRESERVE_ATTRIBUTE}][id]`)
  );
  for (const replacement of incomingCandidates) {
    const existing = existingById.get(replacement.id);
    if (!existing || !canPreserveNode(existing, replacement)) continue;
    syncPreservedAttributes(existing, replacement);
    replacement.replaceWith(existing);
  }
}
function canPreserveNode(existing, replacement) {
  if (existing.tagName !== replacement.tagName) return false;
  if (isInputElement(existing) && isInputElement(replacement)) {
    return existing.type === replacement.type;
  }
  return true;
}
function syncPreservedAttributes(existing, replacement) {
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
function isInputElement(element) {
  return element.tagName === "INPUT";
}
function focusValidationTarget(fragment) {
  const target = fragment.querySelector(
    '[autofocus], [aria-invalid="true"], input:invalid, select:invalid, textarea:invalid'
  );
  target == null ? void 0 : target.focus();
}
function createRequestController(externalSignal) {
  const controller = new AbortController();
  if (!externalSignal) return { signal: controller.signal, dispose: () => void 0 };
  if (externalSignal.aborted) controller.abort(externalSignal.reason);
  const onAbort = () => controller.abort(externalSignal.reason);
  externalSignal.addEventListener("abort", onAbort, { once: true });
  return {
    signal: controller.signal,
    dispose: () => externalSignal.removeEventListener("abort", onAbort)
  };
}
function markBusy(element) {
  const previous = element.getAttribute("aria-busy");
  element.setAttribute("aria-busy", "true");
  return () => {
    if (previous === null) element.removeAttribute("aria-busy");
    else element.setAttribute("aria-busy", previous);
  };
}
function dispatchNavigationError(target, detail) {
  var _a;
  const document2 = target instanceof Node ? target.ownerDocument : getDefaultDocument();
  const CustomEventConstructor = ((_a = document2 == null ? void 0 : document2.defaultView) == null ? void 0 : _a.CustomEvent) ?? globalThis.CustomEvent;
  target.dispatchEvent(
    new CustomEventConstructor("mr:layer-navigation:error", {
      bubbles: true,
      detail
    })
  );
}
function dispatchNavigationResult(target, url, outcome) {
  var _a;
  const CustomEventConstructor = ((_a = target.ownerDocument.defaultView) == null ? void 0 : _a.CustomEvent) ?? globalThis.CustomEvent;
  const detail = { outcome, url };
  target.dispatchEvent(
    new CustomEventConstructor("mr:layer-navigation:result", {
      bubbles: true,
      detail
    })
  );
}
function navigateFallback(anchor, url) {
  var _a;
  (_a = anchor.ownerDocument.defaultView) == null ? void 0 : _a.location.assign(url.href);
}
function isAbortError(error) {
  return error instanceof DOMException && error.name === "AbortError";
}
export {
  LayerNavigationHttpError,
  LayerNavigationProtocolError,
  initLayerNavigation,
  layerNavigation
};
//# sourceMappingURL=markup-refine-lib-layer-navigation.js.map
