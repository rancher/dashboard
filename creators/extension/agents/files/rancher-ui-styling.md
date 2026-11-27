# Rancher Dashboard — Styling & Design Tokens

The design-token layer underneath the components and patterns: colour, spacing, radius, typography, layout grid, z-index. Use this to answer "what value do I put here" without inventing one.

For components see `rancher-ui-components.md`, for page compositions see `rancher-ui-patterns.md`.

> **On staleness.** Token *names* are stable; token *values* change with theme work. Verify a value against `shell/assets/styles/themes/_modern.scss` in `rancher/dashboard` before relying on a specific hex. Names and groupings below were read off `master` on 2026-10-13.

---

## Contents

- [How tokens reach your extension](#how-tokens-reach-your-extension)
- [Colour tokens](#colour-tokens)
- [Colour helper classes](#colour-helper-classes)
- [Theming & dark mode](#theming--dark-mode)
- [Spacing](#spacing)
- [Spacing helper classes](#spacing-helper-classes)
- [Observed spacing conventions](#observed-spacing-conventions)
- [Borders, radius & outline](#borders-radius--outline)
- [Typography](#typography)
- [Layout grid & breakpoints](#layout-grid--breakpoints)
- [Layout dimensions & z-index](#layout-dimensions--z-index)
- [SCSS mixins & functions](#scss-mixins--functions)
- [Rules of thumb](#rules-of-thumb)

---

## How tokens reach your extension

Two separate mechanisms. Know which one you are using.

**1. CSS custom properties (`var(--token)`) — runtime, theme-aware.**
Defined on `BODY` by `shell/assets/styles/themes/_modern.scss` and re-declared under `.theme-dark`. Available everywhere with no import, and they re-resolve when the user switches theme. **This is the default choice for anything colour-related.**

**2. SCSS variables (`$space-m`), functions (`z-index()`) and mixins (`@include clip`) — build time.**
`shell/vite.config.mjs` (and `shell/pkg/vite.config.mjs`, which builds packages) prepends these to every `<style lang="scss">` block it compiles:

```js
additionalData: `
  @use 'sass:math';
  @import "~shell/assets/styles/base/_variables.scss";
  @import "~shell/assets/styles/base/_functions.scss";
  @import "~shell/assets/styles/base/_mixins.scss";
`
```

An extension scaffolded by `@rancher/create-extension` builds with that config (its `vite.config.mjs` imports `@rancher/shell/vite.config.mjs`), so **`$space-m`, `$max-width`, `z-index('tooltip')` and `@include clip` work in your `.vue` files with no `@import` line.** Anything outside those three files (`_color.scss`, `_spacing.scss`, theme files) you must import explicitly, e.g. `@import "~shell/assets/styles/base/_color.scss";`.

Do not re-import `_variables.scss` "just to be safe" — it is already there, and a second import in a component that also uses `@use` can trip Sass's load-order rules.

---

## Colour tokens

All are CSS custom properties. The system is **semantic, not literal** — there is no `--blue`, there is `--primary`.

### The suffix convention

Most semantic families expand into the same nine-token shape. Learn the shape once and you can predict the name:

| Suffix | Meaning | Example |
|---|---|---|
| *(none)* | the colour itself, for text/fills/borders | `--error` |
| `-text` | readable foreground **on** that colour | `--error-text` |
| `-hover-bg` / `-hover-text` | hover state of a filled element | `--primary-hover-bg` |
| `-active-bg` / `-active-text` | pressed state | `--primary-active-bg` |
| `-border` | border when the fill is that colour | `--warning-border` |
| `-banner-bg` | 15% tint — `Banner` backgrounds | `--info-banner-bg` |
| `-light-bg` | 5% tint — very subtle fills | `--success-light-bg` |

Families with the full shape: `primary`, `link`, `default`, `darker`, `success`, `info`, `warning`, `error`, `disabled`.

### Status & intent

| Token | Use for |
|---|---|
| `--primary` | The brand action colour. Primary buttons, active states, default bar fill |
| `--secondary`, `--on-secondary`, `--secondary-border`, `--secondary-hover` | Secondary surfaces and their foregrounds |
| `--tertiary`, `--tertiary-header`, `--on-tertiary`, `--tertiary-hover`, `--tertiary-border` | Tertiary surfaces (nav panels, app bar) |
| `--success` / `--info` / `--warning` / `--error` | Semantic state. Never pick a literal green/red |
| `--link`, `--link-text`, `--link-text-secondary` | Anchors. `--link-text-secondary` is the underlined subdued link |
| `--disabled`, `--disabled-text`, `--disabled-bg` | Disabled controls and muted numbers |
| `--muted`, `--deemphasized` | Secondary body copy. `--muted` is the `text-muted` class |
| `--active`, `--on-active`, `--active-nav`, `--on-active-nav` | Selected nav / list rows |

### Surfaces & chrome

`--body-bg`, `--body-text`, `--body-text-hover`, `--box-bg`, `--box-bg--inverted`, `--box-border--inverted`, `--simple-box-bg`, `--simple-box-border`, `--simple-box-divider`, `--simple-box-shadow`, `--overlay-bg`, `--subtle-overlay-bg`, `--shadow`, `--header-bg`, `--header-border`, `--nav-bg`, `--nav-active`, `--nav-hover`, `--nav-border`, `--footer-bg`, `--topmenu-bg`, `--topmenu-text`, `--scrollbar-thumb`, `--scrollbar-track`.

### Forms

`--input-text`, `--input-label`, `--input-placeholder`, `--input-bg`, `--input-bg-accent`, `--input-border`, `--input-hover-bg`, `--input-hover-border`, `--input-focus-bg`, `--input-addon-bg`, `--label-secondary`, and the `--input-disabled-*` set (`-text`, `-label`, `-bg`, `-border`, `-placeholder`). Checkboxes: `--checkbox-tick`, `--checkbox-border`, `--checkbox-ticked-bg`, `--checkbox-tick-disabled`, `--checkbox-disabled-bg`.

### Tables, dropdowns, popovers

- Tables: `--sortable-table-bg`, `--sortable-table-row-bg`, `--sortable-table-header-bg`, `--sortable-table-hover-bg`, **`--sortable-table-selected-bg`** (the row-hover/selection colour reused by custom list rows), `--sortable-table-top-divider`, `--sortable-table-body-divider`, `--sortable-table-group-label`
- Dropdowns: `--dropdown-bg`, `--dropdown-border`, `--dropdown-divider`, `--dropdown-text`, `--dropdown-hover-bg`, `--dropdown-hover-text`, `--dropdown-active-bg`, `--dropdown-active-text`, `--dropdown-disabled-text`, `--dropdown-group-text`, `--dropdown-highlight-text`
- Popovers / tooltips: `--popover-bg`, `--popover-border`, `--popover-text`, `--popover-border-radius`, `--tooltip-bg`, `--tooltip-border`, `--tooltip-text`, `--tooltip-bg-warning`, `--tooltip-text-warning`
- Modals / drawers: `--modal-bg`, `--modal-border`, `--drawer-body-bg`
- Tabs: `--tabbed-border`, `--tabbed-sidebar-bg`, `--tabbed-container-bg`
- Progress & gauges: `--progress-bg`, `--progress-divider`, `--gauge-divider`, `--gauge-zero`, `--gauge-success-primary/-secondary`, `--gauge-warning-primary/-secondary`, `--gauge-error-primary/-secondary`, `--resource-gauge-back-circle`
- Tags & badges: `--tag-bg`, `--tag-primary`, `--card-badge-text`, `--badge-state-disabled-text/-bg/-border`, the `--click-badge-{error,warning,success,info}` triplets (`-`, `-bg`, `-border`), `--{warning,success,info,error}-badge`, `--on-{warning,success,info,error}-banner`
- Terminal / logs / diff / window manager: `--terminal-bg`, `--terminal-text`, `--terminal-cursor`, `--terminal-selection`, `--logs-bg`, `--logs-text`, `--logs-highlight`, `--logs-highlight-bg`, the `--diff-*` set, the `--wm-*` set
- Charts: `--sizzle-0` … `--sizzle-8` (the categorical series palette) plus `--sizzle-success`, `--sizzle-info`, `--sizzle-warning`, `--sizzle-error`, `--sizzle-unknown`

> **Use `--sizzle-N` for chart series.** It is the only categorical palette in shell, it is theme-aware, and it is what the built-in graphs use. Don't hand-pick chart colours.

### `--rc-*` tokens

A parallel set scoped to `pkg/rancher-components` while component theming is being worked out: `--rc-info`, `--rc-success`, `--rc-warning`, `--rc-error`, `--rc-unknown`, `--rc-none` (each with a `-secondary` variant), `--rc-primary-hover`, `--rc-active-background`, `--rc-active-border`, `--rc-inactive-background`, `--rc-inactive-border`, `--rc-disabled-background`, `--rc-disabled-text-color`, `--rc-section-background-primary`, `--rc-section-background-secondary`, `--rc-section-counter-background`, `--rc-section-counter-border`, `--rc-image-bg`, `--rc-image-color`.

They exist so `Rc*` components can be styled without reaching into shell. **In extension code prefer the plain semantic tokens** (`--error`, not `--rc-error`) unless you are overriding a specific `Rc*` component's appearance — the comment in the theme file says these will eventually move out of shell.

### What shell does *not* have

No severity scale, no CVE/scan-status colours. That gap, and the sanctioned fill-in, are covered by **Severity & Status Palette** in `rancher-ui-components.md` — the one approved custom palette (rule #4 in `SKILL.md`).

---

## Colour helper classes

Global, no import needed:

| Class | Effect |
|---|---|
| `text-primary`, `text-link`, `text-default`, `text-darker`, `text-muted`, `text-deemphasized`, `text-disabled`, `text-success`, `text-info`, `text-warning`, `text-error` | `color: var(--<name>) !important` |
| `bg-primary`, `bg-link`, `bg-default`, `bg-darker`, `bg-disabled`, `bg-transparent`, `bg-success`, `bg-info`, `bg-warning`, `bg-error` | Background **plus** the matching readable foreground, and hover/active handling when combined with `.btn` |
| `secondary-text-link` | Subdued underlined link that drops the underline on hover |

Reach for these before writing `color: var(--error)` in a scoped block — one class is cheaper than a style rule and keeps the `!important` consistent.

---

## Theming & dark mode

- The app writes `theme-light` or `theme-dark` onto `<body>` (`shell/mixins/brand.js`, driven by the `theme` preference, which supports `auto`). A brand class such as `classic` may sit alongside it.
- Themes are layered in `app.scss` as: `modern` → `light` → `dark` → `suse`. **`_modern.scss` defines the defaults under `BODY, .theme-light` and `BODY, .theme-dark`** — it is the live token set. `_light.scss` / `_dark.scss` only override inside `.classic`, the legacy brand.
- **The correct dark-mode selector in a scoped component style is `body.theme-dark &`.** Not `@media (prefers-color-scheme: dark)` — the user's explicit preference beats the OS one, and the media query ignores it.

```scss
.my-chip {
  background: var(--box-bg);          // handles both themes on its own

  .zero-segment {
    background: $zero-color-light;     // a literal needs an explicit override
    body.theme-dark & { background: $zero-color-dark; }
  }
}
```

- Every hard-coded hex is a dark-mode bug waiting to happen. If you must use one (a brand logo colour, a severity scale), pair it with a `body.theme-dark &` rule in the same block so the two can never drift apart.

---

## Spacing

Shell carries **two spacing scales** because of an incomplete migration. Both are live.

| | Legacy 5px scale | Modern 4px scale |
|---|---|---|
| Source | `base/_helpers.scss` | `base/_spacing.scss` |
| Classes | `m-5` … `m-50`, `p-5` … `p-50`, `mt-`/`mr-`/`mb-`/`ml-`, `pt-`/`pr-`/`pb-`/`pl-`, `in-` (text-indent) | `mm-1` … `mm-20`, `pp-1` … `pp-20`, `mmt-`/`mmr-`/`mmb-`/`mml-`, `ppt-`/`ppr-`/`ppb-`/`ppl-` |
| Naming | the **pixel value** — `mt-20` = `margin-top: 20px` | the **step** — `mmt-2` = `margin-top: 8px` (step × 4) |
| Range | 5–50px in 5px steps, plus `-0` | 4–80px in 4px steps, plus `-0` |
| `!important` | yes | no |

**Which to use:** the 4px scale and the `--gap` tokens for anything new. The 5px classes stay for consistency with the surrounding file — in particular **`mt-20` on form rows is the established convention** (see **Multi-Column Form Row** in `rancher-ui-patterns.md`) and should not be "modernised" to `mmt-5` in isolation.

### Gap tokens

| Token | Value | Use for |
|---|---|---|
| `--gap` | 8px | Tight groupings — icon + label, chips in a row |
| `--gap-md` | 16px | The default stack gap. `RcSection` content, `RcContentGroup` |
| `--gap-lg` | 24px | Between groups and major sections |

Always with a fallback when used inside `pkg/rancher-components`-style code: `gap: var(--gap-md, 16px)`.

### SCSS spacing variables

```scss
$space-s: 10px;   // tight inner padding, footer bars
$space-m: 24px;   // page gutter — .outlet uses this
$space-l: 40px;   // large separation
```

Plus the form/input constants: `$input-padding-sm: 10px`, `$input-padding-lg: 18px`, `$input-line-height: 18px`, `$input-height: 61px`, `$unlabeled-input-height: 40px`, `$column-gutter: 1.75%`, `$array-list-remove-margin: 75px`, `$sideways-tabs-width: 200px`, `$resource-detail-min-width: 740px`, `$max-width: 1440px`, `$min-width: 75%`.

### The page gutter is already applied

`.outlet` (the router outlet every page renders into) sets `padding: $space-m` — **24px on all four sides**. Your page component starts inside that padding.

- Don't add an outer `padding: 24px` to a page root; you'll get 48px
- To break out of it — a full-bleed footer bar, for instance — negate it, which is what `CruResource` does: `margin-left: -$space-m; margin-right: -$space-m;`

---

## Spacing helper classes

```html
<!-- legacy 5px scale, !important -->
<div class="row mt-20">…</div>
<p class="mb-10">…</p>

<!-- modern 4px scale, step-numbered -->
<div class="pp-4">…</div>   <!-- padding: 16px -->
<div class="mmb-6">…</div>  <!-- margin-bottom: 24px -->
```

Other spacing helpers worth knowing: `.spacer` (`padding: 40px 0 0`), `.spacer-small` (`padding: 20px 0 0`), `.dashed-spacer` (24px vertical margin + dashed rule), `.container` (centred, `max-width: $max-width`, 20px side padding).

---

## Observed spacing conventions

What shell actually does, so your extension looks native rather than merely tidy. Values read off the current source.

| Context | Spacing |
|---|---|
| Page outer gutter (`.outlet`) | `padding: 24px` |
| `Masthead` bottom margin | `20px`, or `24px` when it has a subheader |
| Form row | `mt-20` on each `div.row` |
| Form label | `margin: 10px 0`, `font-size: 12px` |
| Form `.group` box | `padding: 20px`, 1px `--input-border` |
| Tab content (`Tabbed`) | `padding-top: 24px`; tab headers `padding: 10px 15px` |
| Detail `Card` | `padding: 16px`, `--border-radius-md`, 18px title |
| Detail `SpacedRow` | 3 equal columns, `grid-gap: 24px`, `min-width: 740px` |
| Detail masthead sections | metadata `margin: 16px 0 24px`, cards `margin-bottom: 24px` |
| `RcSection` | header/content gap `8px`, header height `56px`, header inner gaps `12px`/`24px`, content stack `var(--gap-md, 16px)`, bottom padding `16px` (`24px` left indent when expandable) |
| `RcSection` containing `RcContentGroup`s | content stack switches to `var(--gap-lg, 24px)` via `&:has(> .rc-content-group)` |
| `RcContentGroup` | stacks its children `var(--gap-md, 16px)` apart |
| Buttons | `height: 40px`, `padding: 0 21px`; small `height: 30px`, `padding: 0 7px` |
| Section header + count | `gap: 8px`, `margin-bottom: 12px`; ~30px above the section |

**The `RcSection` / `RcContentGroup` contract is the cleanest spacing model in the codebase — use it for forms.** Write inputs straight into `RcSection` and they stack 16px apart with no wrapper; wrap them in `RcContentGroup`s and the section spaces the groups 24px apart automatically. You never write a margin.

---

## Borders, radius & outline

| Token | Value | Use for |
|---|---|---|
| `--border-width` | `1px` | Every border width. Write `var(--border-width) solid var(--border)` |
| `--border-radius` | `4px` | Default — inputs, buttons, small chips |
| `--border-radius-md` | `6px` | Cards, panels |
| `--border-radius-lg` | `8px` | Large tooltips, `RcSection` secondary surfaces |
| `--outline`, `--outline-width` | — | Focus/hover rings: `box-shadow: 0 0 1px var(--outline-width) var(--outline)` |
| `--border`, `--subtle-border`, `--input-border` | — | Border colours: general, low-contrast dividers, form controls |
| `--popover-border-radius` | `var(--border-radius)` | Popovers |

Fully rounded pills are written as a large literal (`border-radius: 30px`) — there is no pill token.

---

## Typography

Base is `14px` Lato on `HTML, BODY`. Three font stacks: `$body-font` (Lato), `$header-font` (Poppins), `$mono-font` (Roboto Mono).

| Element | Size | Notes |
|---|---|---|
| `H1` | 24px | Page titles |
| `H2` | 21px (`$font-size-h2`) | Section titles |
| `H3` | 18px | Sub-sections, card titles |
| `H4` | 16px | |
| `H5` | 14px | |
| `H6` | 12px | Also `text-transform: uppercase` |

All headings get `font-weight: 400`, `color: var(--body-text)` and `margin: 0 0 10px` from the `h-css` mixin — including a bottom margin you will often need to zero out in flex rows (`h1 { margin: 0; }`, which is what `Masthead` does). `P` has no margin at all.

Text helper classes: `text-small` (0.85em), `text-normal`, `text-bold`, `text-italic`, `text-left/center/right`, `text-uppercase`, `text-lowercase`, `text-capitalize`, `text-label`, `text-no-break`, `monospace`. Layout-adjacent: `.clip` behaviour comes from the `@include clip` mixin, not a class.

---

## Layout grid & breakpoints

A 12-column flex grid (`global/_columns.scss`), also available at 6, 10, 11, 23 and 24 columns via an `-of-N` suffix.

```html
<div class="row mt-20">
  <div class="col span-6">…</div>
  <div class="col span-6">…</div>
</div>
```

- `.row` is `display: flex`; `.col` carries a `1.75%` right gutter that is removed on the last child
- `span-N` for the 12-column default, `span-N-of-24` etc. for the others
- `offset-N` shifts a column right; `.gutless` on an ancestor removes gutters and recomputes widths
- `.container-flex` / `.container-flex-center` for a wrapping flex row, with `.flex-item-half`
- Equal-height helpers: `.equal-height` on a `.col`, `.row-full-height`, `.col-full-height`, `.row-same-height`

### Breakpoints

```scss
$breakpoints: (
  '--viewport-4':  480px,   // Phone
  '--viewport-7':  768px,   // Tablet
  '--viewport-9':  992px,   // Laptop/Desktop
  '--viewport-12': 1281px,  // Desktop
);

@media only screen and (min-width: map-get($breakpoints, '--viewport-9')) { … }
```

Use these rather than ad-hoc widths. The one common exception in dashboard code is a `max-width: 1200px` stack-to-column rule for summary strips, which sits between `--viewport-9` and `--viewport-12`.

---

## Layout dimensions & z-index

| Token / variable | Value | Meaning |
|---|---|---|
| `--header-height` | 55px | Top header |
| `--nav-width` | 250px | Side nav when expanded |
| `--footer-height` | 0px (`$footer-height: 60px`) | Footer, usually collapsed |
| `$app-bar-collapsed-width` / `$app-bar-expanded-width` | 70px / 300px | App bar states — keep both together, the cluster-switcher flyout anchors to either |
| `$cluster-switcher-flyout-width` | 380px | Shared with the wipe animation in `ClusterSwitcher.vue` |
| `--wm-tab-height` | 29px | Window-manager tabs |

Never write a raw `z-index` number. Use the map in `_variables.scss` through the `z-index()` function:

```scss
.my-overlay { z-index: z-index('dropdownOverlay'); }
```

Keys, in ascending order: `zero`, `default`, `overContent`, `hoverOverContent`, `tableGroup`, `fixedTableHeader`, `loading`, `windowsManager`, `mainHeader`, `cruFooter`, `copyToClipboard`, `loadingMain`, `slide-in`, `modalOverlay`, `modalContent`, `dropdownOverlay`, `dropdownContent`, `tooltip`. An unknown key emits a Sass `@warn` and returns `null`, so a typo silently drops the declaration — check the key.

---

## SCSS mixins & functions

Auto-available (from `_mixins.scss` / `_functions.scss`):

| Mixin | Does |
|---|---|
| `@include clip` | `text-overflow: ellipsis; overflow: hidden; white-space: nowrap;` — the standard truncation |
| `@include force-wrap` | The opposite: wrap long unbroken strings |
| `@include no-select` | Disable text selection (clickable headers, toggles) |
| `@include hand` | `cursor: pointer` |
| `@include list-unstyled` | Zero out a `ul` |
| `@include bordered-section` | 1px bottom border + 20px margin/padding below |
| `@include section-divider` | 20px top and bottom margin |
| `@include clearfix` | Classic float clear |
| `@include input-status-color` | Applies the success/warning/error border states to a form control |
| `@include form-focus` / `@include focus-outline` | The standard focus treatments — use these instead of a custom `outline` |
| `@include contrasted($bg)` | Picks a readable foreground for a background |
| `@include bg-lighten($bg)`, `@include link-color($c, $hover)` | Derived colour helpers |
| `@include icon-rotate(…)`, `@include icon-flip(…)` | Icon transforms |
| `@include extension-dialog` | Standard dialog chrome for extension-contributed dialogs |

| Function | Does |
|---|---|
| `z-index($key)` | Looks up the z-index map |
| `contrast-color($color)` | Dark or light foreground for a given background |
| `brightness($color)` | Perceived brightness, 0–100% |
| `decimal-round($n, $places, $mode)` | Rounding used by the column maths |

---

## Rules of thumb

1. **Semantic token over literal colour, always.** `var(--error)`, never `#dc2626`. The only sanctioned exception is the severity/scan-status palette in `rancher-ui-components.md`.
2. **Helper class over a one-line style rule.** `class="text-muted mt-20"` beats a scoped block that sets the same two properties.
3. **If you write a hex, write the `body.theme-dark &` override in the same block.** Otherwise it is a dark-mode bug by construction.
4. **Don't add outer padding to a page root** — `.outlet` already applies 24px.
5. **Stick to one spacing scale per file.** Match whatever the surrounding code uses; prefer the 4px scale and `--gap*` tokens in new files.
6. **Let `RcSection` / `RcContentGroup` do form spacing.** Hand-written margins between inputs are a smell.
7. **`z-index()`, never a raw number.** A hand-picked 9999 will eventually land on top of a modal that needed to be on top of you.
8. **`@include clip` for truncation**, plus a `title` or tooltip carrying the full text. Identifiers (CVE IDs, image digests, resource names) must never wrap to a second line.
9. **New token = last resort.** Search `_modern.scss` first; if you genuinely need one, name it semantically, define it for both themes, and say why in the PR.
