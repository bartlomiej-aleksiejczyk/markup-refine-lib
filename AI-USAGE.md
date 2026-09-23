# Markup Refine — AI integration guide

> **Audience:** coding agents integrating `markup-refine-lib` into another application.
>
> This is a consumer guide. It is **not** a maintainer/contributor guide for developing Markup Refine itself.

Use this file as the primary integration context when modifying an application that depends on `markup-refine-lib`.

## 1. Integration rules

Follow these rules before writing code:

1. **Prefer native HTML first.** Use the browser primitive that already represents the interaction (`<form>`, `<details>`, `<dialog>`, Popover API, links, buttons, ARIA relationships) before adding library behavior.
2. **Use only public package exports.** Import from documented `markup-refine-lib/*` entry points. Never import `src/library/**`, implementation classes, generated build internals, or undocumented paths.
3. **Opt styling in explicitly.** Importing Markup Refine CSS does not mean the entire host application should be restyled. Add `data-mr` only to the document/subtree that should receive semantic Markup Refine styling.
4. **Keep presentation and behavior separate.** `mr-*` classes style things. `data-mr-*` attributes opt into behavior/configuration. Do not use styling classes as JavaScript selectors or application state.
5. **Let native state remain authoritative.** Do not duplicate dialog `open`, Popover `:popover-open`, form validity, `aria-expanded`, `aria-selected`, etc. in a second application state machine unless the application genuinely needs separate domain state.
6. **Do not reimplement overlay infrastructure.** For Markup Refine Layers, do not add an application-level focus trap, backdrop manager, z-index stack, Escape handler, or outside-click engine. Layer/Tooltip managers already coordinate those behaviors.
7. **Preserve a lower-capability path for essential tasks.** Important actions must remain possible through normal links/forms, inline content, or native disclosures when JavaScript or a native capability is unavailable.
8. **Do not silently change modality.** If Popover is unsupported, do not automatically replace it with a modal. Choose an explicit fallback appropriate to the application.
9. **Do not turn Layer navigation into a router.** The optional remote module is for narrow same-origin HTML-first modal subinteractions, not general SPA navigation/history/fragment swapping.
10. **Do not invent Markup Refine API.** If a class, attribute, method, event, or package export is not documented here or in the installed package documentation, verify it before using it.

## 2. Choose the smallest feature that solves the task

Use this decision order:

| Need | Preferred solution |
| --- | --- |
| Refine ordinary semantic HTML | `markup-refine-lib/css` + `data-mr` |
| Only selected CSS layers | `/tokens`, `/base`, `/components`, `/layout` |
| Standard progressive-enhancement behaviors | `/behaviors` |
| Local modal/drawer/popover orchestration | `/layers` |
| Supplementary delayed tooltip with optional pinned content | `/tooltips` |
| Same-origin server-rendered modal subinteraction | `/layer-navigation` |
| Simple disclosure | Native `<details>`; no Layer |
| Simple popover without orchestration | Native `popover`/`popovertarget`; Layer may be unnecessary |
| Broad server-driven navigation/history/fragment swapping | Use a dedicated tool such as htmx/Unpoly/Turbo instead of expanding Layer navigation |
| General application state / routing / CRUD metadata | Application/framework responsibility, not Markup Refine |

## 3. Installation and default setup

Install the package normally:

```sh
npm install markup-refine-lib
```

For most applications, import the complete stylesheet once in the application entry point:

```ts
import "markup-refine-lib/css";
```

Then opt the desired subtree into semantic styling:

```html
<header>Host application header</header>

<main data-mr class="mr-container">
  <h1>Users</h1>

  <form>
    <label>
      Name
      <input name="name" />
    </label>
    <button>Save</button>
  </form>
</main>
```

Do **not** add `data-mr` to the entire application automatically if only one island should use Markup Refine.

### Opt a subtree back out

```html
<section data-mr>
  <button>Markup Refine styling</button>

  <div data-mr-unstyled>
    <button>Host/native styling</button>

    <section data-mr>
      <button>Markup Refine styling again</button>
    </section>
  </div>
</section>
```

`data-mr-unstyled` is a semantic-style boundary. A nested `data-mr` explicitly opts back in.

## 4. Focused CSS imports

Use focused imports only when the host application needs tighter CSS composition:

```ts
import "markup-refine-lib/tokens";
import "markup-refine-lib/base";
import "markup-refine-lib/components";
import "markup-refine-lib/layout";
```

When importing focused entries, preserve this order:

1. `tokens`
2. `base`
3. `components`
4. `layout`

Do not copy Markup Refine source CSS into the host project merely to customize it.

## 5. Theming

Customize through `--mr-*` CSS custom properties on the application root or a specific Markup Refine island.

```css
.admin-area {
  --mr-color-primary: var(--app-accent-color);
  --mr-radius-medium: var(--app-control-radius);
  --mr-container-max-width: var(--app-content-width);
}
```

Prefer application-owned variables on the right-hand side rather than scattering literal configuration values through component selectors.

Useful public token families include:

- `--mr-color-*`
- `--mr-font-family-*`
- `--mr-space-*`
- `--mr-radius-*`
- `--mr-control-*`
- `--mr-focus-*`
- `--mr-motion-duration-*`
- `--mr-layer-*`
- layout-specific tokens such as `--mr-stack-gap`, `--mr-grid-gap`, and `--mr-container-max-width`

Do not solve theme overrides with higher selector specificity or `!important` unless the host application has a separate, justified constraint.

## 6. Layout primitives

Use the small layout vocabulary instead of inventing atomic Markup Refine utility classes:

```html
<main class="mr-container">
  <section class="mr-stack">
    <div class="mr-cluster mr-cluster--between">...</div>
    <div class="mr-grid">...</div>
    <span class="mr-inline">...</span>
  </section>
</main>
```

Stable primitives:

- `.mr-container` — bounded content width and fluid horizontal padding
- `.mr-stack` — vertical flow
- `.mr-cluster` — wrapping horizontal group
- `.mr-inline` — non-wrapping inline group
- `.mr-grid` — intrinsic responsive grid

Common cluster modifiers currently include:

- `.mr-cluster--around`
- `.mr-cluster--between`
- `.mr-cluster--center`
- `.mr-cluster--end`
- `.mr-cluster--fill`

Do not invent Tailwind-like `.mr-mt-*`, `.mr-p-*`, `.mr-w-*`, breakpoint, or atomic color utilities.

## 7. Component classes and behavior hooks

Presentation classes are opt-in and use the `mr-*` namespace. Examples include:

```html
<article class="mr-card mr-card--positive">
  <header class="mr-card__header">Status</header>
  <p>Everything is ready.</p>
</article>

<button class="mr-button--outlined">Outline</button>
<button class="mr-button--positive">Save</button>
```

Behavior hooks use `data-mr-*`, for example:

```html
<pre data-mr-copyable><code>npm install example</code></pre>
```

Never infer behavior from `.mr-*` classes. Never use `data-mr-*` as a styling namespace unless the documented feature explicitly does so.

When adding a component, consult the installed/public docs for its exact markup rather than guessing class names from another component.

## 8. Standard behavior bundle

For normal enhanced components, import:

```ts
import "markup-refine-lib/behaviors";
```

This bundle initializes standard `data-mr-*` behaviors when the document is ready, including Layers and Tooltips. It does **not** initialize remote Layer navigation.

For dynamically inserted SSR/partial-rendered content, initialize only the new subtree:

```ts
import { initMarkupRefineBehaviors } from "markup-refine-lib/behaviors";

initMarkupRefineBehaviors(container);
```

The initializer is idempotent and safe to call repeatedly.

Do not repeatedly scan the whole document after every partial update when the newly inserted subtree is available.

## 9. Layers: choose native modal, drawer, or popover semantics

Public import:

```ts
import { initLayers, layers } from "markup-refine-lib/layers";
```

Layer modes are:

```ts
type LayerMode = "modal" | "drawer" | "popover";
```

When using Markup Refine presentation, the same optional content scaffold works in every Layer mode:

```html
<header class="mr-layer__header">
  <div class="mr-layer__heading">
    <h2 class="mr-layer__title">Title</h2>
    <p class="mr-layer__description">Optional supporting text.</p>
  </div>
  <button>Close</button>
</header>
<div class="mr-layer__body">...</div>
<footer class="mr-layer__actions">...</footer>
```

These classes are presentation only. Never use them as behavior selectors; behavior still comes from native HTML plus `data-mr-layer`.

### Modal

Use native `<dialog>` plus the Layer hook. Presentation classes are optional but recommended when using Markup Refine styling.

```html
<a href="/settings">Settings page</a>

<button commandfor="settings-dialog" command="show-modal">
  Open settings dialog
</button>

<dialog
  id="settings-dialog"
  class="mr-layer mr-layer--modal"
  data-mr-layer="modal"
  aria-labelledby="settings-title"
>
  <h2 id="settings-title">Settings</h2>
  <p>...</p>
  <button commandfor="settings-dialog" command="request-close">Close</button>
</dialog>
```

The normal link is the lower-capability route for an essential workflow.

### Drawer

A drawer is the same native modal dialog lifecycle with different presentation:

```html
<button commandfor="navigation-drawer" command="show-modal">Menu</button>

<dialog
  id="navigation-drawer"
  class="mr-layer mr-layer--drawer"
  data-mr-layer="drawer"
  aria-labelledby="navigation-title"
>
  <h2 id="navigation-title">Navigation</h2>
  <nav aria-label="Primary">...</nav>
  <button commandfor="navigation-drawer" command="request-close">Close</button>
</dialog>
```

Do not build a separate drawer state engine.

### Popover Layer

If ownership/lifecycle orchestration is needed for non-modal floating UI:

```html
<button popovertarget="format-help">Formatting help</button>

<div
  id="format-help"
  popover="auto"
  data-mr-layer="popover"
  class="mr-layer mr-layer--popover"
>
  <p>Formatting help...</p>
</div>
```

If no orchestration is needed, plain native Popover API is preferable and `data-mr-layer` can be omitted.

### Programmatic Layer API

Initialize direct Layer usage when not importing the complete behaviors bundle:

```ts
import { initLayers, layers } from "markup-refine-lib/layers";

initLayers(document);

await layers.open("#settings-dialog", {
  trigger: settingsButton,
});
```

Stable manager API:

```ts
layers.get(target)
layers.closest(node)
layers.open(target, { trigger?, parent? })
layers.ask<T, R>(target, { trigger?, parent? })
layers.current
layers.stack
```

Stable Layer instance API:

```ts
layer.open({ trigger?, parent? })
layer.close({ restoreFocus? })
layer.ask<T, R>({ trigger?, parent? })
layer.accept<T>(value)
layer.dismiss<R>(reason?)
```

Read-only Layer properties:

```ts
layer.element
layer.mode
layer.state
layer.trigger
layer.parent
layer.children
```

Normally pass the actual invoker through `trigger`; parentage is then inferred from where that trigger lives. Supply `parent` explicitly only when the caller really owns orchestration that cannot be inferred from DOM/invoker context.

Backdrop/outside-click rule: when a modal or drawer is current, clicking outside that current surface is a global Layer dismissal. Markup Refine closes every active Layer in the same document, including nested popovers/tooltips, consumes the initiating click, and restores focus to the root opener. Do not add a per-modal outside-click handler that competes with this behavior.

## 10. Layer result workflows

Use `ask()` for local subinteractions that return a value.

```ts
type Author = { id: string; name: string };

const outcome = await layers.ask<Author, "cancel">(authorDialog, {
  trigger: createAuthorButton,
});

if (outcome.status === "accepted") {
  authorInput.value = outcome.value.name;
}
```

Outcome shape:

```ts
type LayerOutcome<T, R = unknown> =
  | { status: "accepted"; value: T }
  | { status: "dismissed"; reason?: R };
```

Inside the child workflow:

```ts
const layer = layers.closest(saveButton);
await layer?.accept({ id: createdAuthor.id, name: createdAuthor.name });
```

or:

```ts
await layer?.dismiss("cancel");
```

Rules:

- accepted/dismissed values are opaque application values;
- Layer core does not know entities, CRUD, IDs, forms, or refresh policy;
- child completion completes only the child;
- the caller explicitly decides how to update the parent UI;
- ordinary close/Escape/request-close while `ask()` is pending resolves as dismissal rather than an exception;
- `layer.close()`, Escape, and dialog `request-close` enter the Layer `closing` state first; the runtime adds `data-mr-layer-closing`, waits for the Layer surface's real finite CSS exit animations/transitions, and only then commits the native close. Do not add a parallel `setTimeout()` just to keep the Layer visible; control the duration in CSS.
- do not create special APIs such as `nestedModal`, `nestedDrawer`, or `refreshParent`.

## 11. Layer lifecycle events

Use events for observation/integration. Prefer `ask()` for workflow composition.

Stable events:

- `mr:layer:beforeopen` — cancelable open request boundary
- `mr:layer:open` — open state settled
- `mr:layer:beforeclose` — cancelable where the native close path allows cancellation
- `mr:layer:close` — close/focus cleanup settled
- `mr:layer:result` — accepted/dismissed result observation

Example:

```ts
surface.addEventListener("mr:layer:open", () => {
  analytics.track("settings-opened");
});
```

Do not use lifecycle events to create a parallel Layer state machine.

## 12. Tooltips and pinned information popovers

Use Tooltips only for supplementary explanations. Essential instructions must already be available in ordinary page content or an explicit fallback.

Tooltip source templates may use the optional presentation primitives `.mr-tooltip__title` and `.mr-tooltip__content`. The runtime preserves them in both the non-interactive preview clone and the promoted pinned Popover Layer. Do not author `.mr-tooltip--preview` or `.mr-tooltip--pinned` surfaces yourself; those are runtime-generated presentation classes.

Public import:

```ts
import {
  initTooltips,
  tooltips,
} from "markup-refine-lib/tooltips";
```

Markup:

```html
<button type="button" data-mr-tooltip="formatting-help">
  Formatting
</button>

<template id="formatting-help">
  <p>Formatting changes presentation without changing the underlying value.</p>
</template>
```

Initialize directly only when not relying on the normal behavior bundle:

```ts
initTooltips(document);
```

Optional timing configuration:

```ts
tooltips.configure({
  showDelay: appTooltipTimings.show,
  pinDelay: appTooltipTimings.pin,
  closeDelay: appTooltipTimings.close,
});
```

Public registry API:

```ts
tooltips.configure(options)
tooltips.get(trigger)
tooltips.closest(node)
tooltips.pin(trigger)
tooltips.hideAll()
```

Tooltip instance API:

```ts
tooltip.show()
tooltip.hide()
tooltip.pin()
tooltip.unpin()
tooltip.state // "hidden" | "waiting" | "preview" | "pinned"
```

Behavior model:

- transient preview uses a native hint popover and stays outside `layers.stack`;
- while the preview waits for `pinDelay`, a runtime pin-progress ring occupies the reserved top-right control slot;
- the ring is determinate: it fills from empty to complete over the actual configured `pinDelay`, then the Tooltip pins; do not add a second CSS timing value;
- pinned interactive content becomes a non-modal **manual** Popover Layer; Markup Refine owns Tooltip dismissal while native `showPopover({ source })` still provides top-layer placement and the implicit anchor relationship;
- preview and pinned surfaces render the same authored HTML and share Tooltip box metrics, so pinning should not resize the window; preview controls are visually present but inert until pinning; leaving the invoking element with the pointer immediately cancels waiting/preview state unless the Tooltip has already pinned;
- pinned surfaces are visually separated from page content by the tooltip surface background/border/shadow plus the size-neutral `.mr-tooltip--pinned` outline;
- pinned Tooltip text is selectable; pointer/focus leave does not close a pinned Tooltip;
- a pinned Tooltip closes through its top-right dismiss button, Escape, or a pointer-down outside the current Tooltip interaction region; clicks/selections inside do not dismiss it, an outside pointer-down dismisses the whole active Tooltip stack, and Escape remains topmost-only;
- nested pinned tooltips use normal Layer parent/child ownership, so a pinned tooltip may contain another `data-mr-tooltip` trigger without a special nesting API; descendant preview surfaces are treated as part of the ancestor interaction region while they wait to pin;
- Tooltip width is independent from its invoking element. Customize `--mr-tooltip-min-inline-size`, `--mr-tooltip-inline-size`, and `--mr-tooltip-max-inline-size`; the default preferred size is `max-content` capped at `24rem`, and Markup Refine does not use `anchor-size(width)` unless your application adds it explicitly;
- tooltip/popover presentation starts at `position-area: block-end center` and uses `position-try-fallbacks` on current anchor-positioning browsers to avoid common viewport-edge collisions;
- no JavaScript coordinate/collision engine is provided for older browsers that lack anchor-position fallback support;
- ordinary button/link activation inside pinned content is still application behavior;
- do not put the only copy of essential information in a tooltip;
- do not treat Tooltips as toast/notification infrastructure.

## 13. Optional remote Layer navigation

Use this only for **same-origin, server-rendered, HTML-first modal subinteractions**.

It is intentionally not part of the normal behavior bundle.

```ts
import {
  initLayerNavigation,
  layerNavigation,
} from "markup-refine-lib/layer-navigation";
```

### Declarative link enhancement

Keep a real standalone URL:

```html
<a href="/authors/new" data-mr-layer-navigation>
  Create author
</a>
```

Then opt the relevant root into remote navigation:

```ts
initLayerNavigation(document);
```

Without JavaScript, `/authors/new` must still be a complete usable page.

### Explicit remote subinteraction

```ts
type Author = { id: string; name: string };

const outcome = await layerNavigation.ask<Author>({
  url: createAuthorLink.href,
  trigger: createAuthorLink,
});

if (outcome.status === "accepted") {
  authorInput.value = outcome.value.name;
}
```

### Server HTML contract

The server response should remain a valid standalone HTML page and expose the part intended for the Layer:

```html
<main data-mr-layer-navigation-fragment>
  <form action="/authors" method="post" data-mr-layer-navigation>
    <!-- normal fields, validation messages and CSRF input -->
    <button type="submit">Create author</button>
  </form>
</main>
```

Validation responses may return the fragment again. Default handled validation statuses are 400 and 422.

For an enhanced multipart form, let the browser construct the multipart request:

```html
<form action="/authors" method="post" enctype="multipart/form-data" data-mr-layer-navigation>
  <input name="name" required>
  <input id="author-avatar" type="file" name="avatar" data-mr-preserve>
  <button type="submit">Create author</button>
</form>
```

`data-mr-preserve` requires a stable `id` and preserves the existing DOM node only across handled validation fragment replacements. This is especially useful for file inputs because the selected `FileList` cannot be recreated from returned HTML. The server must return the matching preserved element to keep it; omit `data-mr-preserve` in the validation response when an invalid file should be cleared and selected again.

A successful server interaction may return an outcome marker:

```html
<script
  type="application/json"
  data-mr-layer-navigation-result="accepted"
>
  {"id":"author-42","name":"Ada Example"}
</script>
```

A dismissal marker uses:

```html
<script
  type="application/json"
  data-mr-layer-navigation-result="dismissed"
>
  "cancel"
</script>
```

The default result payload is JSON because the default parser reads the marker text as JSON. Applications may provide `parseResult` when another result encoding is required.

### Remote-navigation constraints

Do not violate these constraints:

- same-origin HTTP(S) only;
- modal subinteractions only;
- no application-history management;
- no general router;
- no cross-origin override;
- no generic arbitrary-fragment engine;
- no automatic retry of ambiguous mutation failures;
- no framework-specific CSRF token name;
- basic same-origin `multipart/form-data` submission is enhanced with browser-created `FormData`;
- never set `Content-Type` manually for a `FormData` request;
- file upload enhancement does not imply progress, chunking, resumability, background upload, or automatic retries;
- use `data-mr-preserve` with a stable `id` when a selected file input must survive a 400/422 fragment replacement;
- unsupported encodings such as `text/plain` still fall back to native submission;
- remote HTML is application-trusted HTML, not arbitrary untrusted third-party content.

The import guard removes scripts, inline `on*` handlers, and `javascript:` navigation attributes, but **it is not a general HTML sanitizer**.

If broad server-driven UI is needed, use a dedicated library instead of expanding this module.

## 14. Remote navigation configuration

Configure policy through JavaScript, not custom HTML attribute DSLs:

```ts
layerNavigation.configure({
  fragmentSelector: appLayerNavigation.fragmentSelector,
  resultSelector: appLayerNavigation.resultSelector,
  validationStatuses: appLayerNavigation.validationStatuses,
  redirect: appLayerNavigation.redirectMode,
  credentials: appLayerNavigation.credentials,
  requestHeaders: appLayerNavigation.requestHeaders,
  parseResult: appLayerNavigation.parseResult,
  onRender: ({ fragment }) => {
    initMarkupRefineBehaviors(fragment);
  },
});
```

The configuration object should come from the host application's configuration/policy layer; do not scatter duplicate selectors, status lists, CSRF headers, or timing constants across feature code.

If `onRender` is used to initialize newly rendered fragments, initialize the fragment itself rather than rescanning the complete document.

## 15. Graceful degradation requirements

For every enhanced feature, identify the baseline before adding JavaScript.

| Enhanced feature | Required baseline strategy |
| --- | --- |
| Modal/drawer workflow | normal page navigation, form, or inline workflow when essential |
| Popover | inline content or `<details>` when essential |
| Tooltip | essential meaning already present outside the tooltip |
| Search dialog | normal search form/link when no-JS search is required |
| Application navigation drawer | persistent/reachable authored navigation |
| Remote Layer GET | real standalone `href` |
| Remote Layer form | real `action` + `method` |

Do not hide fallback content before enhancement succeeds.

If initialization fails, the normal HTML task must remain reachable.

## 16. Closing animations

Markup Refine deliberately does **not** expose a hard-coded JavaScript close delay. A controlled close keeps the native Layer open while CSS animates the transient `data-mr-layer-closing` state, then performs the native close when those finite animations/transitions finish.

With the standard `.mr-layer` presentation, configure the normal token:

```css
[data-mr] {
  --mr-layer-motion-duration: 220ms;
}
```

For completely custom presentation, target the closing hook yourself:

```css
[data-mr-layer="modal"] {
  opacity: 0;
  transform: translateY(0.75rem);
  transition: opacity 180ms ease, transform 180ms ease;
}

[data-mr-layer="modal"][open]:not([data-mr-layer-closing]) {
  opacity: 1;
  transform: none;
}
```

Then close through the Layer lifecycle:

```ts
const layer = layers.get(dialog);
await layer?.close(); // resolves after exit motion and the native close
```

Prefer dialog `command="request-close"`, Escape, or `layer.close()` when you want coordinated exit motion. An unconditional direct native `dialog.close()` / `command="close"` bypasses the cancelable request path, so the Layer cannot delay that operation before it happens.

Do not make exit motion essential to understanding or operating the UI. Markup Refine's standard CSS reduces Layer motion to zero when `prefers-reduced-motion: reduce` is active.

## 17. Accessibility rules

When integrating the library:

- give dialogs/popovers meaningful accessible names (`aria-labelledby` or an appropriate label);
- use semantic buttons for actions and anchors for navigation;
- preserve native form labels and validation;
- do not manually trap focus around a native modal dialog;
- do not make tooltip previews focusable;
- keep tooltip information supplementary;
- allow Markup Refine's reduced-motion and forced-colors behavior to work rather than overriding it with inaccessible fixed animations/colors;
- preserve real `href`/`action` targets for progressive enhancement;
- prefer `command="request-close"` over unconditional `command="close"` when the close should follow native cancelable request semantics.

## 18. SSR, partial rendering, and framework integration

The public initializers accept a `ParentNode` and are intended to be safe for repeated/subtree initialization.

For content inserted by React/Vue/Svelte/Astro/HTMX/server partial rendering:

```ts
import { initMarkupRefineBehaviors } from "markup-refine-lib/behaviors";

function afterFragmentMounted(fragmentRoot: HTMLElement) {
  initMarkupRefineBehaviors(fragmentRoot);
}
```

If the feature uses remote Layer navigation, initialize that explicitly as well because it is not in the default behavior bundle:

```ts
import { initLayerNavigation } from "markup-refine-lib/layer-navigation";

initLayerNavigation(fragmentRoot);
```

Do not initialize browser-only behavior during server rendering when `document`/DOM APIs do not exist. Importing the focused modules is designed to be safe; invoke DOM initialization on the client.

## 19. Tailwind or custom CSS

Markup Refine behavior does not require Markup Refine presentation classes.

You may use the Layer behavior hooks with your own CSS/Tailwind styling:

```html
<dialog
  data-mr-layer="modal"
  class="your-application-dialog-classes"
  aria-labelledby="profile-dialog-title"
>
  ...
</dialog>
```

Do not duplicate modal lifecycle JavaScript just because presentation is custom.

When Tailwind is already used by the host application, use Tailwind for application-specific presentation rather than asking Markup Refine to grow a parallel atomic utility catalogue.

## 20. What not to build on top of Markup Refine

Do **not** extend Markup Refine concepts in the consuming application into any of the following unless they are purely application-owned abstractions:

- custom top-layer implementation;
- custom focus-trapping framework for native dialogs;
- general SPA router;
- browser-history framework;
- generic server fragment engine;
- ORM/entity metadata protocol;
- CRUD engine;
- implicit parent refresh system;
- application state manager;
- backend-specific CSRF convention embedded into library assumptions;
- generic toast/notification system disguised as Tooltip;
- automatic Popover-to-modal fallback;
- JS-only endpoint with no normal web fallback for an essential task.

## 21. Integration checklist for an AI agent

Before finishing a change in a consuming project, verify all applicable items:

- [ ] Imports use only public `markup-refine-lib/*` exports.
- [ ] Markup Refine semantic styling is explicitly scoped with `data-mr`.
- [ ] Host HTML outside the intended scope is not accidentally restyled.
- [ ] Theme/configuration values are centralized through application configuration/CSS variables rather than duplicated literals.
- [ ] Presentation uses `mr-*`; behavior uses `data-mr-*`.
- [ ] Native HTML/ARIA state is not mirrored unnecessarily.
- [ ] Dynamic content is initialized at the smallest available subtree.
- [ ] Dialog/drawer/popover code does not introduce a second overlay engine.
- [ ] `ask()` outcomes are handled using the discriminated `status` field.
- [ ] Parent UI changes are explicit caller behavior, not assumed Layer behavior.
- [ ] Tooltip content is supplementary.
- [ ] Remote navigation, if used, is same-origin, HTML-first, modal-only, and has real fallback URLs/forms.
- [ ] Mutation failures are not automatically replayed.
- [ ] Essential workflows still work at a lower capability level.
- [ ] Accessibility labels/relationships remain valid.
- [ ] Unsupported Popover capability does not silently change to modal behavior.
- [ ] No undocumented Markup Refine class/attribute/API was invented.

## 22. Public package entry points

Use these package entry points only:

```text
markup-refine-lib/css
markup-refine-lib/tokens
markup-refine-lib/base
markup-refine-lib/components
markup-refine-lib/layout
markup-refine-lib/behaviors
markup-refine-lib/layers
markup-refine-lib/tooltips
markup-refine-lib/layer-navigation
```

For package metadata only:

```text
markup-refine-lib/package.json
```

If a future installed version exposes a different public `exports` map, treat that installed package version as authoritative and adapt the integration rather than importing private files.

## 23. Where to look when this guide is not enough

In the Markup Refine repository/distribution, the authoritative human-facing references are:

- `README.md` — installation and high-level package usage
- `LAYER-API.md` — detailed Layer architecture and stable contract
- the generated documentation site — component-specific markup/examples

When exact behavior differs from this guide, first verify the version of `markup-refine-lib` installed by the consuming application and use documentation matching that version.
