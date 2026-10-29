# Rancher Dashboard — UI Component Reference

Complete reference for Rancher Dashboard's UI building blocks. Components sourced from `pkg/rancher-components` and `shell/components`.

For the colour, spacing, radius and typography tokens these components are built from — and the values to use when you write your own — see `rancher-ui-styling.md`.

> **Check Storybook first: https://rancher.github.io/storybook/** — rendered components with live, current props, published from `rancher/dashboard` on every merge. This file is a convenience index that can drift; Storybook and the source cannot.

## Importing

These aliases are preconfigured by the extension scaffold (tsconfig `paths` + Vite alias), so there is nothing to set up:

| Alias | Points at | Use for |
|---|---|---|
| `@shell/...` | `@rancher/shell` | Shell components, utils, config, store, mixins, types |
| `@components/...` | `@rancher/components` | Standalone component library — form controls, `Banner`, `Card`, `BadgeState`, `RcButton` |
| `@pkg/...` | your own `pkg/<name>/` | Self-references inside your extension |

The paths listed under each component below are **source locations in `rancher/dashboard`**, for reading the implementation — not import specifiers. Translate `pkg/rancher-components/src/components/X` → `@components/X`, `shell/components/X` → `@shell/components/X`.

---

## Contents

**Feedback & Status**
- [Banner](#banner)
- [BadgeState](#badgestate)
- [StateDot](#statedot)
- [Loading](#loading)
- [AsyncButton](#asyncbutton)

**Layout & Containers**
- [Card](#card)
- [RcSection](#rcsection)
- [Accordion](#accordion)
- [Tabbed](#tabbed)
- [Tab](#tab)
- [CruResource](#cruresource)
- [ResourceTabs](#resourcetabs)

**Tables & Data**
- [SortableTable](#sortabletable)
- [ResourceTable](#resourcetable)
- [PaginatedResourceTable](#paginatedresourcetable)
- [Masthead](#masthead)

**Form Inputs**
- [LabeledInput](#labeledinput)
- [LabeledSelect](#labeledselect)
- [RadioGroup](#radiogroup)
- [RadioButton](#radiobutton)
- [Checkbox](#checkbox)
- [ArrayList](#arraylist)
- [KeyValue](#keyvalue)
- [Labels](#labels)
- [NameNsDescription](#namenshDescription)
- [UnitInput](#unitinput)
- [StringList](#stringlist)
- [Questions](#questions)

**Actions & Navigation**
- [RcButton](#rcbutton)
- [RcButtonSplit](#rcbuttonsplit)
- [ButtonGroup](#buttongroup)
- [ActionMenu](#actionmenu)
- [RcDropdown](#rcdropdown)

**Overlay & Structure**
- [Drawer](#drawer)
- [Window](#window)

**Display**
- [RcIcon](#rcicon)
- [RcItemCard](#rcitemcard)
- [RcTag](#rctag)
- [LabeledTooltip](#labeledtooltip)

**Security & Dashboard Primitives** (not importable — rebuild in your extension - work done in https://github.com/rancher/security-ui-exts)
- [Severity & Status Palette](#severity--status-palette)
- [Stat Block](#stat-block)
- [Distribution Chart](#distribution-chart)
- [Severity Amount Bar](#severity-amount-bar)
- [Score Badge](#score-badge)
- [Status Pill](#status-pill)
- [Fix Available Icon](#fix-available-icon)
- [Info Tooltip](#info-tooltip)
- [Percentage Bar Variants](#percentage-bar-variants)

---

## Banner

**Import from:** `pkg/rancher-components/src/components/Banner/Banner.vue`
**Also known as:** Alert · Callout · Notification · Feedback message

Displays a contextual message with a color-coded severity indicator. Supports optional icons and a close button. The standard component for all inline alerts and notices — never build a custom alert.

**Key props:**
- `color` (String, default: `'secondary'`) — Severity variant: `primary` · `secondary` · `success` · `warning` · `error` · `info`
- `label` (String | Error | Object) — Message text or error object
- `labelKey` (String) — i18n key for the message
- `icon` (String) — Icon class shown on the left
- `closable` (Boolean, default: `false`) — Show a close button
- `stacked` (Boolean, default: `false`) — Stack icon above label instead of inline
- `disabled` (Boolean, default: `false`) — Muted/disabled appearance

**Slots:** Default — custom content in place of `label`

**Best practices:**
- Use `error` for validation failures and destructive warnings that need user action
- Use `info` for passive contextual guidance that does not block the user
- Use `warning` for non-blocking risks (e.g., resource limits approaching)
- Prefer `label`/`labelKey` for simple strings; use the default slot for rich content with links
- Only set `closable: true` for informational messages where dismissing causes no data loss
- Place banners above the form section they describe, not at the very top of the page

**Anti-patterns:**
- Don't use a `success` banner as a persistent state indicator — use `BadgeState` instead
- Don't stack multiple `error` banners; consolidate into a list or rely on `CruResource`'s built-in error display
- Don't use `color="primary"` for errors — primary is a brand/info color, not a severity

---

## BadgeState

**Import from:** `pkg/rancher-components/src/components/BadgeState/BadgeState.vue`
**Also known as:** Status badge · State pill · Resource status chip

Renders an inline colored badge showing a resource's current state (e.g., Active, Error, Pending). Typically used inside table cells, resource headers, or summary rows.

**Key props:**
- `value` (Object) — Resource object with `stateBackground` and `stateDisplay` properties (computed by the store state mixin)
- `color` (String) — Overrides the background color directly (hex or CSS class)
- `icon` (String) — Icon class shown before the label
- `label` (String) — Override text (defaults to `value.stateDisplay`)

**Best practices:**
- Let the resource store compute the badge color — pass the full `value` object rather than hardcoding `color`
- Use in `SortableTable` column definitions via `formatter: 'BadgeState'`
- Keep label text to 1–2 words; longer state descriptions belong in a tooltip

**Anti-patterns:**
- Don't use `BadgeState` for arbitrary decorative tags — it is semantic; use a plain styled `span` or `Pill` for non-status labels
- Don't manually set `color` unless the store-computed state cannot be reused

---

## StateDot

**Import from:** `shell/components/StateDot/index.vue`
**Also known as:** State dot · Status dot · Health indicator dot

A small colored dot conveying resource health at a glance. Lighter-weight than `BadgeState` — no text label, only a visual indicator. Use when space is too constrained for a full badge.

**Key props:**
- `color` (StateColor, required) — Color variant matching the resource state
- `size` (String, default: `'8px'`) — Dot diameter as a CSS size string

**Best practices:**
- Pair with a tooltip that provides the state label the dot omits — color alone fails WCAG contrast requirements
- Use `BadgeState` whenever there is room for a text label; reserve `StateDot` for icon-only columns or dense layouts
- Derive `color` from the same state-mixin utilities used by `BadgeState` for consistency

**Anti-patterns:**
- Don't use `StateDot` as the only state indicator without an accessible text alternative nearby
- Don't use custom hex colors — stick to the `StateColor` enum values so theming works correctly

---

## Loading

**Import from:** `shell/components/Loading.vue`
**Also known as:** Spinner · Loading indicator

Displays a loading overlay or inline spinner for asynchronous operations. Automatically hides when `loading` becomes `false`.

**Key props:**
- `loading` (Boolean) — Show the spinner when `true`
- `mode` (String, default: `'content'`) — `content` (replaces section content) · `main` (full-page overlay) · `relative` (inline within parent)
- `noDelay` (Boolean, default: `false`) — Show immediately, skipping the default 300 ms delay

**Best practices:**
- Use `mode="main"` only during initial page load (`$fetchState.pending`)
- Use `mode="content"` to mask a data section while it refreshes
- Prefer `mode="relative"` inside cards or side panels to avoid layout shift
- Always pair `Loading` with error handling — never leave it running indefinitely on fetch failure

**Anti-patterns:**
- Don't use `Loading` for button-click feedback — use `AsyncButton` instead
- Don't show a full-page spinner for partial data refreshes — scope the spinner to the affected section

---

## AsyncButton

**Import from:** `shell/components/AsyncButton.vue`
**Also known as:** Submit button · Loading button · Action button

A button that manages its own loading state during async operations. Shows a spinner while an action is in progress and prevents double-clicks automatically.

**Key props:**
- `mode` (String, default: `'edit'`) — Drives default label via i18n (`edit` → "Save", `delete` → "Delete")
- `disabled` (Boolean, default: `false`) — Prevent interaction
- `delay` (Number, default: `5000`) — Milliseconds before auto-resetting after completion
- `actionColor` (String, default: `'role-primary'`) — Button color class
- `type` (String, default: `'button'`) — HTML button type: `button` · `submit`

**Events:** `@click(cb)` — Fires with a callback; call `cb(true)` for success or `cb(false)` for failure to reset the button state

**Best practices:**
- Always call the callback `cb(success)` — without it, the button stays in the loading state permanently
- Use for any action involving a network round-trip (save, delete, apply, sync)
- Bind `disabled` to form validation so the button is safe to click before the user fills required fields
- Use `mode` to map standard CRUD verbs to localized labels instead of custom strings

**Anti-patterns:**
- Don't use for navigation links — use `<router-link>` or `<a>`
- Don't use for instant synchronous actions — a plain `RcButton` avoids the misleading spinner

---

## Card

**Import from:** `pkg/rancher-components/src/components/Card/Card.vue`
**Also known as:** Panel · Container · Dialog body

A bordered content container with optional title header and action footer. The primary structural shell for dialogs and standalone content panels.

**Key props:**
- `title` (String) — Heading rendered in the card header
- `content` (String) — Body text (use the default slot for rich content)
- `buttonText` (String) — Primary action button label
- `buttonAction` (Function) — Callback for the primary button click
- `showHighlightBorder` (Boolean, default: `false`) — Left accent border for selected or featured cards

**Slots:** `#title`, `#body`, `#actions`

**Best practices:**
- Use named slots (`#title`, `#body`, `#actions`) instead of props for non-trivial content
- Use `showHighlightBorder` to visually distinguish a selected or featured card
- Keep card titles to one line; push detail into the body or a tooltip

**Anti-patterns:**
- Don't nest `Card` inside another `Card` — use `RcSection` for inner grouping
- Don't use `Card` as a table row — use `RcItemCard` for catalog/item-style layouts

---

## RcSection

**Import from:** `pkg/rancher-components/src/components/RcSection/RcSection.vue`
**Also known as:** Section · Form section · Collapsible group

Groups related content under an optional title with optional collapse/expand behaviour. The standard way to segment a long form or detail page into named sections without using tabs.

**Key props:**
- `title` (String) — Section heading
- `expandable` (Boolean) — Show collapse/expand toggle
- `expanded` (Boolean, v-model) — Controls open state
- `mode` (String) — `create` · `edit` · `view`
- `background` (String) — Background color variant
- `type` (String) — Visual style variant

**Slots:** `#counter`, `#errors`, `#badges`, `#actions`, default

**Events:** `@update:expanded`

**Best practices:**
- Use `expandable` for optional or advanced sections that most users can skip
- Pair the `#errors` slot with validation messages scoped to that section
- Use the `#actions` slot for section-scoped controls (e.g., an "Add field" button)
- Default `expanded` to `true` — collapsed defaults hide content users may need

**Anti-patterns:**
- Don't use `RcSection` for page-level structure — that is `CruResource`'s responsibility
- Don't put interactive form controls in `#badges` — it is for display-only tags

---

## Accordion

**Import from:** `pkg/rancher-components/src/components/Accordion/Accordion.vue`
**Also known as:** Collapse · Expandable · Disclosure

A single collapsible section with a click-to-toggle title bar. For multiple grouped collapsibles, prefer `RcSection` with `expandable`.

**Key props:**
- `title` (String) — Heading text
- `titleKey` (String) — i18n key for the heading
- `openInitially` (Boolean, default: `false`) — Start expanded

**Slots:** Default — content revealed when expanded

**Best practices:**
- Use for one section of content that benefits from progressive disclosure
- Keep the title actionable and descriptive: "Advanced settings", not "More"
- Animate open/close — the component handles this automatically

**Anti-patterns:**
- Don't nest Accordions — creates confusing UX and visual depth
- Don't use for primary content — only secondary or optional information

---

## Tabbed

**Import from:** `shell/components/Tabbed/index.vue`
**Also known as:** Tab container · Tabbed interface

Parent container that manages a set of `Tab` children, rendering a tab bar and the active tab's content panel.

**Key props:**
- `defaultTab` (String) — `name` of the tab to activate on mount
- `sideTabs` (Boolean, default: `false`) — Render tabs as a vertical sidebar instead of a horizontal bar
- `hideSingleTab` (Boolean) — Hide the tab bar when only one tab exists
- `showTabsAddRemove` (Boolean) — Show add/remove tab controls
- `scrollOnChange` (Boolean) — Scroll to top on tab change

**Events:** `@changed(tab)`, `@addTab`, `@removeTab`

**Best practices:**
- Always pair with `<Tab>` children that have unique `name` props
- Use `sideTabs` for forms with 4+ tabs — horizontal tabs overflow on smaller screens
- Set `defaultTab` to the tab containing the most common first-action field
- Control tab order with the `weight` prop on `Tab` rather than relying on DOM order

**Anti-patterns:**
- Don't use `Tabbed` for fewer than 2 tabs — show content directly
- Don't place save/cancel actions inside tab content — those belong in `CruResource`'s footer
- Don't use tab labels exceeding ~20 characters

---

## Tab

**Import from:** `shell/components/Tabbed/Tab.vue`

Individual tab panel consumed by `Tabbed`. Must be a direct child of `Tabbed`.

**Key props:**
- `name` (String, required) — Unique identifier used for routing and `defaultTab`
- `label` (String) — Display label in the tab bar
- `labelKey` (String) — i18n key for the label
- `weight` (Number) — Ordering weight; lower numbers appear first
- `tooltip` (String) — Tooltip on the tab button
- `displayAlertIcon` (Boolean) — Show a warning icon on the tab (use when that section has validation errors)
- `showHeader` (Boolean, default: `true`) — Show the label as an `<h2>` above the panel content

**Events:** `@active` — Fired when this tab becomes selected

**Best practices:**
- Use `displayAlertIcon` to surface per-tab validation errors without forcing users to click through every tab
- Keep `name` lowercase and hyphen-separated — it appears in the URL hash
- Group logically related fields in one tab, not by resource subtype

---

## CruResource

**Import from:** `shell/components/CruResource.vue`
**Also known as:** Create-Edit wrapper · Resource form wrapper · CRUD shell

The top-level wrapper for all resource create and edit pages. Provides the save/cancel footer, error display, subtype selector, and optional YAML toggle. Every edit page component must have `CruResource` as its root.

**Key props:**
- `mode` (String, required) — `create` · `edit` · `view`
- `resource` (String | Object, required) — The resource being edited or its type string
- `validationPassed` (Boolean, default: `true`) — Enables the Save button; bind to `fvFormIsValid`
- `subtypes` (Array) — Subtype selector options rendered above the form
- `selectedSubtype` (String) — Currently active subtype
- `showCancel` (Boolean, default: `true`) — Show the Cancel button
- `cancelEvent` (Boolean) — Emit `@cancel` instead of navigating back
- `doneRoute` (String | Object) — Route to navigate to after save

**Events:** `@select-type`, `@error`, `@cancel`, `@finish`

**Best practices:**
- Always bind `validationPassed` to `fvFormIsValid` from the `FormValidation` mixin
- Use `cancelEvent: true` when embedding the form in a modal or wizard
- Mix in `CreateEditView` on the page component — `CruResource` relies on its `save()` and `done()` methods
- Place `NameNsDescription` before any `Tabbed` block — it is always the first form element

**Anti-patterns:**
- Don't place `CruResource` inside a dialog — dialogs use `Card` directly
- Don't add extra buttons to the footer — use `CruResource`'s built-in extension points

---

## ResourceTabs

**Import from:** `shell/components/form/ResourceTabs/index.vue`
**Also known as:** Detail tabs · Resource detail container

Wraps `Tabbed` for detail (view-only) pages. Automatically injects standard tabs — Conditions, Events, Labels & Annotations — based on the resource type.

**Key props:**
- `value` (Object, default: `{}`) — The resource instance
- `mode` (String, default: `'view'`) — `view` · `edit`
- `defaultTab` (String) — Tab to activate on mount

**Slots:** Default — custom `<Tab>` components added before the injected standard tabs

**Best practices:**
- Always use `ResourceTabs` instead of bare `Tabbed` on detail pages — it provides the standard tab set automatically
- Add custom tabs via the default slot with a `weight` lower than 99 (injected standard tabs start at 99)
- Pass the full resource as `value` — `ResourceTabs` reads metadata to determine which standard tabs to show

**Anti-patterns:**
- Don't use `ResourceTabs` on create/edit pages — use `Tabbed` directly inside `CruResource`

---

## SortableTable

**Import from:** `shell/components/SortableTable/index.vue`
**Also known as:** Data table · Table

A full-featured data table with built-in sorting, filtering, pagination, row selection, grouping, and bulk actions. The base for all Rancher data tables.

**Key props:**
- `rows` (Array, required) — Data rows
- `headers` (Array, required) — Column definitions: `[{ name, label, value, sort, width, formatter }]`
- `groupBy` (String) — Field name to group rows by
- `tableActions` (Boolean, default: `true`) — Show bulk action toolbar
- `rowActions` (Boolean, default: `true`) — Show per-row kebab action menu
- `search` (Boolean, default: `true`) — Show search box
- `paging` (Boolean, default: `true`) — Paginate results
- `rowActionsWidth` (Number) — Width of the row actions column

**Slots:** Named column slots for custom cell rendering: `#col:fieldName="{ row }"`

**Best practices:**
- Derive `headers` from the store getter `'type-map/headersFor'` for schema-driven columns
- Use the `formatter` property on column definitions to map values to display components (e.g., `'BadgeState'`, `'Date'`)
- Set a unique `keyField` on rows to help Vue efficiently update the DOM on refresh
- Use `groupBy: 'metadata.namespace'` for cluster-scoped resources to segment by namespace

**Anti-patterns:**
- Don't use `SortableTable` for fewer than ~5 rows — a plain list or `KeyValue` read-only view is cleaner
- Don't hardcode all headers when schema-driven headers are available

---

## ResourceTable

**Import from:** `shell/components/ResourceTable.vue`
**Also known as:** Kubernetes resource table

Wraps `SortableTable` with Kubernetes-specific extensions: namespace filtering, an age column, resource watch subscription, and extension slot support. Prefer this over raw `SortableTable` for native K8s resources.

**Key props:** Inherits all `SortableTable` props, plus:
- `schema` (Object) — Kubernetes resource schema (drives namespace filter and RBAC-aware columns)
- `rows` (Array, required) — Resource instances

**Best practices:**
- Use `ResourceTable` for small-to-medium collections of Kubernetes resources
- Switch to `PaginatedResourceTable` for large resource types where server-side pagination is needed

---

## PaginatedResourceTable

**Import from:** `shell/components/PaginatedResourceTable.vue`
**Also known as:** Server-paginated table · Large resource table

Extends `ResourceTable` with server-side pagination for large resource collections. The default choice for list pages in modern Rancher.

**Key props:**
- `schema` (Object, required) — Resource schema
- `headers` (Array) — Override column definitions
- `namespaced` (Boolean) — Auto-derived from schema if omitted
- `groupBy` (String) — Group rows by field
- `fetchSecondaryResources` (Function) — Callback for loading related data in parallel

**Best practices:**
- Default to `PaginatedResourceTable` for all new list pages — client-side tables cause memory issues at scale
- Provide `headers` only when schema-derived columns need reordering or custom formatters

**Anti-patterns:**
- Don't mix `PaginatedResourceTable` with a hand-rolled create action button — wire the create flow through `Masthead`

---

## Masthead

**Import from:** `shell/components/ResourceList/Masthead.vue`
**Also known as:** List page header · Resource list header

The header bar for resource list pages. Renders the resource title, create button, and optional subheader. Handles RBAC-aware button visibility automatically.

**Key props:**
- `resource` (String, required) — Resource type string (e.g., `'pod'`)
- `schema` (Object) — Resource schema for permission checks and button visibility
- `isCreatable` (Boolean) — Show the Create button
- `isYamlCreatable` (Boolean) — Show "Create from YAML" option
- `createLocation` (Object) — Router location for the create action
- `typeDisplay` (String) — Override the auto-generated resource type display name
- `favoriteResource` (String) — Enable the favorite-star toggle for this resource type

**Slots:** `#typeDescription`, `#subHeader`, `#actions`, `#extraActions`, `#createButton`

**Best practices:**
- Always pass `schema` — it controls button visibility based on RBAC
- Use `#extraActions` for secondary action buttons (e.g., "Import", "Sync") while keeping the primary Create button clean
- Use `typeDisplay` only when the auto-derived label is confusing for the resource type

---

## LabeledInput

**Import from:** `pkg/rancher-components/src/components/Form/LabeledInput/LabeledInput.vue`
**Also known as:** Text input · Form field · Input field

A text input with a floating label, inline validation status indicator, and optional tooltip. The default choice for any single-line string field in a form.

**Key props:**
- `value` (String | Number) — Controlled value
- `type` (String, default: `'text'`) — `text` · `password` · `number` · `email` · `cron` · `multiline` · `multiline-password` · `integer`
- `label` (String) — Floating label text
- `labelKey` (String) — i18n key for the label
- `placeholder` (String) — Placeholder shown when the field is empty
- `required` (Boolean) — Show required indicator on the label
- `disabled` (Boolean) — Read-only appearance
- `status` (String) — Validation state: `info` · `success` · `warning` · `error`
- `tooltip` (String) — Tooltip on the label info icon

**Events:** `@input`, `@update:value`, `@update:validation`

**Best practices:**
- Always provide a `label` or `labelKey` — placeholder-only inputs fail accessibility requirements
- Bind `status` to a computed validation result rather than a static string
- Use `type="multiline"` for long free-text fields instead of a raw `<textarea>`
- Use `type="integer"` for whole-number fields to get built-in number validation
- Use `type="password"` for all secret or credential fields

**Anti-patterns:**
- Don't use `LabeledInput` for selecting from a fixed list — use `LabeledSelect`
- Don't use `type="number"` for quantities with units — use `UnitInput`

---

## LabeledSelect

**Import from:** `shell/components/form/LabeledSelect.vue`
**Also known as:** Dropdown · Select input · Combobox · Multi-select

A select/combobox with floating label, search filtering, and optional multi-select support. Built on vue-select.

**Key props:**
- `value` (String | Array | Object) — Selected value(s)
- `options` (Array, required) — Items: plain strings, or `{ label, value }` objects
- `label` (String) — Floating label
- `labelKey` (String) — i18n key for the label
- `multiple` (Boolean) — Allow selecting multiple values
- `taggable` (Boolean) — Allow creating new options by typing
- `clearable` (Boolean) — Show a clear button
- `searchable` (Boolean, default: `true`) — Allow typing to filter the option list
- `disabled` (Boolean)
- `appendToBody` (Boolean) — Portal the dropdown to the document body (avoids overflow clipping)

**Events:** `@update:value`, `@on-open`, `@on-close`, `@on-focus`, `@on-blur`, `@searching`

**Best practices:**
- Set `appendToBody: true` when the select is inside a table cell, modal, or `overflow: hidden` container
- Use `multiple` + `taggable` for free-form tag inputs (labels, roles, hostnames)
- Provide `{ label, value }` objects when the display label differs from the stored value
- List the most common options first in the `options` array

**Anti-patterns:**
- Don't use for binary choices — use `RadioGroup` or a checkbox instead
- Don't use for large async datasets without filtering the options server-side

---

## RadioGroup

**Import from:** `pkg/rancher-components/src/components/Form/Radio/RadioGroup.vue`
**Also known as:** Radio buttons · Option selector

A labeled group of radio buttons for selecting exactly one value from a small fixed set of options.

**Key props:**
- `name` (String, required) — Unique group name (required for accessibility)
- `options` (Array, required) — `[{ label, value }]` objects or plain string array
- `value` (Boolean | String | Object) — Currently selected value
- `labels` (Array) — Display labels when `options` contains plain values
- `disabled` (Boolean)
- `label` (String) — Group label displayed above the radios
- `labelKey` (String) — i18n key for the group label
- `row` (Boolean, default: `false`) — Arrange buttons horizontally
- `tooltip` (String | Object) — Tooltip on the group label

**Events:** `@update:value`

**Best practices:**
- Use when the user must choose exactly one from 2–5 visible options
- Use `row: true` for 2–3 short options to save vertical space
- Always provide a `label` or `labelKey` for the group — unlabeled radio groups fail accessibility

**Anti-patterns:**
- Don't use for more than 5 options — switch to `LabeledSelect`
- Don't use when all options cannot fit on a single visible screen

---

## RadioButton

**Import from:** `pkg/rancher-components/src/components/Form/Radio/RadioButton.vue`
**Also known as:** Radio option

An individual radio button. Use `RadioGroup` for standard form fields; use `RadioButton` directly only when building a custom selection layout (e.g., icon-grid selectors) where the wrapping `RadioGroup` cannot accommodate the visual design.

**Key props:**
- `name` (String, default: `''`) — Group name — must match across all sibling `RadioButton` instances
- `val` (any, required) — The value this button represents when selected
- `value` (any, required) — The currently selected group value (binds selection state)
- `label` (String) — Display label
- `disabled` (Boolean)
- `mode` (String, default: `'edit'`)
- `description` (String) — Supplementary text below the label
- `descriptionKey` (String) — i18n key for description
- `useBodyTextColor` (Boolean) — Use body text color for label

**Events:** `@update:value`

**Best practices:**
- Prefer `RadioGroup` for standard form fields — `RadioButton` is for custom layouts only
- Always set a matching `name` across all siblings for correct keyboard navigation and accessibility
- Use `description` to clarify each option when labels alone are ambiguous

**Anti-patterns:**
- Don't use `RadioButton` directly when `RadioGroup` supports the layout — `RadioGroup` manages grouping semantics automatically
- Don't mix `RadioButton` and `RadioGroup` for the same form field

---

## Checkbox

**Import from:** `pkg/rancher-components/src/components/Form/Checkbox/Checkbox.vue`
**Also known as:** Check · Tick · Toggle

A labeled checkbox for boolean form values.

**Key props:**
- `value` (Boolean | String | String[], default: `false`) — Checked state
- `label` (String) — Label text beside the checkbox
- `labelKey` (String) — i18n key for the label
- `disabled` (Boolean)
- `indeterminate` (Boolean) — Show the indeterminate (partially checked) state
- `mode` (String, default: `'edit'`) — `edit` · `view`
- `tooltip` (String | Object) — Tooltip on the label
- `valueWhenTrue` (Boolean | String | Number, default: `true`) — Value emitted when checked (allows non-boolean bindings)
- `description` (String) — Supplementary text below the label
- `descriptionKey` (String) — i18n key for the description
- `primary` (Boolean) — Render with primary/emphasized styling

**Events:** `@update:value`

**Best practices:**
- Always provide `label` or `labelKey` — an unlabeled checkbox fails accessibility requirements
- Use `indeterminate` for "select all" controls that reflect a mixed selection state (some items checked, some not)
- Use `description` for brief supplementary context (what enabling this option actually does)
- Use `primary: true` when the checkbox is the main decision on the form (e.g., a feature opt-in)

**Anti-patterns:**
- Don't use for mutually exclusive options — use `RadioGroup`
- Don't stack multiple unrelated booleans on a single row — stack them vertically with consistent spacing

---

## ArrayList

**Import from:** `shell/components/form/ArrayList.vue`
**Also known as:** Array input · Repeatable field · String list input

A dynamic list of text inputs the user can add to, remove from, and reorder. Used for arrays of simple values (hostnames, arguments, IP ranges).

**Key props:**
- `value` (Array) — Array of string values
- `mode` (String, default: `'edit'`) — `edit` · `view`
- `title` (String) — Section title above the list
- `valueLabel` (String, default: `'Value'`) — Column header label
- `valuePlaceholder` (String) — Placeholder text for input rows
- `initialEmptyRow` (Boolean, default: `false`) — Start with one empty input ready to fill
- `showHeader` (Boolean, default: `false`) — Show the column header row
- `protip` (String | Boolean) — Helper text shown below the inputs

**Events:** `@add`, `@remove`, `@update:value`

**Slots:** `#title`, `#column-headers`, `#empty`

**Best practices:**
- Use `initialEmptyRow: true` when the field is required — a visible input is clearer than a hidden "Add" button
- Bind a descriptive `title` so the input has clear purpose in context
- Use `showHeader: true` only when a column label adds meaningful context (e.g., "Hostname")

**Anti-patterns:**
- Don't use for key-value pairs — use `KeyValue` instead
- Don't use when the list has a fixed known length — individual `LabeledInput` fields are clearer

---

## KeyValue

**Import from:** `shell/components/form/KeyValue.vue`
**Also known as:** Map input · Key-value editor · Labels editor · Annotations editor

An editor for key-value pairs stored as a JavaScript object or array of tuples. Used for Kubernetes labels, annotations, environment variables, and config maps.

**Key props:**
- `value` (Array | Object) — The data; usually a flat object map
- `mode` (String, default: `'edit'`) — `edit` · `view`
- `asMap` (Boolean, default: `true`) — Treat value as an object rather than an array of pairs
- `title` (String) — Section title
- `keyLabel` (String) — Column header for the key column
- `valueLabel` (String) — Column header for the value column
- `initialEmptyRow` (Boolean) — Start with an empty row
- `binaryValueKeys` (Array | Object) — Keys whose values should be masked in view mode

**Events:** `@update:value`, `@focusKey`

**Slots:** `#title`, dynamic `#label:keyName` per row

**Best practices:**
- Use for all Kubernetes label and annotation editing — do not build a custom key-value UI
- Set `keyLabel` and `valueLabel` to domain-specific terms (e.g., "Variable", "Value" for env vars)
- Use `binaryValueKeys` for secrets or tokens that must be masked in view mode

**Anti-patterns:**
- Don't use for single-value fields — `LabeledInput` is the correct component for those
- Don't use for nested or structured objects — `KeyValue` handles only flat string-string pairs

---

## Labels

**Import from:** `shell/components/form/Labels.vue`
**Also known as:** Labels & Annotations editor · Metadata editor

A combined editor for both Kubernetes labels and annotations on a resource. Internally renders two `KeyValue` blocks, with display controls to suit different form layouts. Use instead of composing two `KeyValue` components manually for `metadata.labels` + `metadata.annotations`.

**Key props:**
- `value` (Object, required) — The resource object; reads and writes `metadata.labels` and `metadata.annotations` in place
- `mode` (String, required) — `create` · `edit` · `view`
- `displaySideBySide` (Boolean, default: `false`) — Render labels and annotations in two side-by-side columns
- `showAnnotations` (Boolean, default: `true`) — Include the annotations section
- `showLabelTitle` (Boolean, default: `true`) — Show the "Labels" section heading
- `showLabelDescription` (Boolean, default: `true`) — Show description text under the heading
- `labelTitleTooltip` (String) — Tooltip on the labels heading
- `annotationTitleTooltip` (String) — Tooltip on the annotations heading
- `compact` (Boolean, default: `false`) — Reduce vertical padding for denser layouts
- `useRcButton` (Boolean, default: `false`) — Use `RcButton` for the add-row button

**Slots:** `#labels` — override the labels section content

**Best practices:**
- Use `Labels` in a dedicated tab at `weight: 99` — same convention as the `KeyValue` Panel pattern
- Use `displaySideBySide: true` when both labels and annotations are sparse and screen width allows
- Prefer `Labels` over two separate `KeyValue` components when the data source is `metadata.labels`/`metadata.annotations` — it keeps layout consistent across all resource forms

**Anti-patterns:**
- Don't use `Labels` for non-metadata key-value data (env vars, config entries) — use `KeyValue` directly for those
- Don't set `showAnnotations: false` unless the resource type genuinely has no annotations (rare)

---

## NameNsDescription

**Import from:** `shell/components/form/NameNsDescription.vue`
**Also known as:** Resource header form · Name namespace form

Renders the standard Name + Namespace + Description header for resource create/edit pages. Must appear at the top of every namespaced resource form, before any tabs or section blocks.

**Key props:**
- `value` (Object, required) — The resource being edited (mutated in place)
- `mode` (String, required) — `create` · `edit` · `view`
- `nameHidden` (Boolean) — Hide the name field
- `nameNsHidden` (Boolean) — Hide both name and namespace fields
- `descriptionHidden` (Boolean) — Hide the description field
- `nameEditable` (Boolean) — Allow editing the name in edit mode (rare — names are immutable in K8s)
- `extraColumns` (Array) — Additional form columns rendered alongside the defaults
- `nameLabel` (String) — Override the default "Name" label

**Events:** `@update:value`, `@isNamespaceNew`

**Best practices:**
- Always place as the first child inside `CruResource`, before `Tabbed` or any `RcSection`
- Listen to `@isNamespaceNew` to show appropriate warnings when a namespace will be created on save
- Use `descriptionHidden: true` only when the resource type has no meaningful user-facing description

**Anti-patterns:**
- Don't render a custom name/namespace field — always use this component for consistency across the UI
- Don't use in view-only contexts without setting `mode="view"` — name becomes editable by default

---

## UnitInput

**Import from:** `shell/components/form/UnitInput.vue`
**Also known as:** Numeric unit input · Memory input · CPU input

A `LabeledInput` variant for numbers with units (bytes, milliseconds, CPU cores). Handles SI and binary unit conversion automatically.

**Key props:**
- `value` (Number | String) — The numeric value
- `baseUnit` (String, default: `'B'`) — Base unit display string
- `suffix` (String) — Display-only unit suffix (skips SI conversion)
- `inputExponent` (Number, default: `0`) — SI modifier for the displayed unit
- `outputModifier` (Boolean, default: `false`) — Append the SI modifier string to the output value (e.g., `"512Mi"`)
- `increment` (Number, default: `1000`) — Use `1024` for binary units (MiB, GiB)
- `outputAs` (String, default: `'number'`) — Return type: `'number'` · `'string'`
- `label` (String) — Inherits all `LabeledInput` label props

**Events:** `@update:value`, `@update:validation`, `@change`, `@blur`

**Best practices:**
- Use `increment: 1024` for memory and storage — Kubernetes uses binary units (MiB, GiB, not MB, GB)
- Use `outputModifier: true` when the API expects a string like `"512Mi"` rather than a raw integer
- Always provide `label` — `UnitInput` wraps `LabeledInput` and inherits all its labeling props

**Anti-patterns:**
- Don't use a plain `LabeledInput` with a static unit suffix — `UnitInput` handles conversion correctly
- Don't combine `suffix` and `baseUnit` — they conflict with each other

---

## StringList

**Import from:** `pkg/rancher-components/src/components/StringList/StringList.vue`
**Also known as:** Tag input · Chip input

Displays a list of strings as chips with add and remove controls. Automatically validates for duplicates.

**Key props:**
- `items` (Array<string>) — Current list of string values

**Events:** Item add, remove, and edit events

**Best practices:**
- Use for short human-readable identifiers (roles, tags, hostnames)
- Show a clear "Add" affordance and display existing items as removable chips
- Duplicate validation is built in — do not add manual duplicate checks on top

**Anti-patterns:**
- Don't use for key-value data — use `KeyValue`
- Don't use for very long lists (20+ items) — use `ArrayList` with a search filter

---

## Questions

**Import from:** `shell/components/Questions/index.vue`
**Also known as:** Helm questions · Dynamic form · Schema-driven form

Renders a complete form dynamically from a Helm chart values schema or question definition array. Handles all question types (string, boolean, enum, int, float, array, reference, YAML), conditional field visibility via JEXL expressions, validation, and nesting — all automatically. Never hand-build a form for Helm chart values.

**Key props:**
- `value` (Object, required) — The values object being built; mutated in place
- `source` (Object | Array, required) — The Helm chart schema or questions array driving the form
- `mode` (String, default: `'edit'`) — `edit` · `view`
- `tabbed` (Boolean | String, default: `true`) — Render top-level question groups as tabs
- `targetNamespace` (String) — Namespace context for namespace-scoped resource questions

**Events:** `@updated`

**Best practices:**
- Use `Questions` for all Helm chart value forms — the schema handles field types, conditionals, and validation automatically
- Pass `mode="view"` to render a read-only values summary in detail pages or confirmation steps
- Use `tabbed: true` (default) for charts with multiple question groups — maps naturally to Rancher's tabbed layout convention

**Anti-patterns:**
- Don't use `Questions` for non-Helm forms — it is tightly coupled to Helm chart schema conventions
- Don't mix `Questions` with manual `LabeledInput` fields targeting the same values object

---

## RcButton

**Import from:** `pkg/rancher-components/src/components/RcButton/RcButton.vue`
**Also known as:** Button

An accessible button component with variant and size control. Use for synchronous actions; use `AsyncButton` for anything with a network round-trip.

**Key props:**
- `variant` (String) — `primary` · `secondary` · `tertiary` · `link` · `multiAction` · `ghost`
- `size` (String) — `small` · `medium` · `large`

**Events:** `@click`

**Slots:** Default — button label content

**Best practices:**
- One `primary` button per visible section maximum
- Use `secondary` for Cancel and other reversible actions
- Use `tertiary` or `link` for low-priority supplementary actions
- Use verb-first labels: "Save changes", "Delete cluster", not "OK" or "Submit"
- Minimum 44×44 px touch target; ensure keyboard focus ring is visible

**Anti-patterns:**
- Don't use `RcButton` for async operations — use `AsyncButton`
- Don't use `ghost` for primary actions — it lacks sufficient visual weight

---

## RcButtonSplit

**Import from:** `pkg/rancher-components/src/components/RcButtonSplit/RcButtonSplit.vue`
**Also known as:** Split button · Multi-action button · Dropdown button

A button with a primary action on the left and a dropdown arrow on the right that reveals secondary actions. Use when there is one clear primary action and 2–4 secondary alternatives that should not all compete for screen space.

**Key props:**
- `variant` (String, default: `'primary'`) — `primary` · `secondary` etc.
- `size` (String, default: `'medium'`) — `small` · `medium` · `large`
- `disabled` (Boolean)
- `items` (Array<RcButtonSplitItem>) — Dropdown action items
- `ariaLabel` (String) — Accessible label for the whole control
- `ariaLabelTrigger` (String) — Accessible label for the primary action portion
- `ariaLabelDropdown` (String) — Accessible label for the dropdown trigger arrow
- `placement` (String, default: `'bottom-end'`) — Floating dropdown placement

**Events:** `@click` (primary), `@update:open`, `@select(id)` (dropdown item)

**Slots:** `#before`, default (primary label), `#after`, `#dropdownCollection`

**Best practices:**
- Use when one action is the clear default but alternatives exist (e.g., "Save" with "Save and continue editing")
- Set `ariaLabelTrigger` and `ariaLabelDropdown` separately — the control is two distinct focusable elements
- Keep the dropdown to ≤ 4 items; more warrants an `ActionMenu` or a dedicated actions area

**Anti-patterns:**
- Don't use when all actions are equally likely — use individual `RcButton` instances or `ActionMenu`
- Don't use as a substitute for `RcDropdown` for non-primary action menus

---

## ButtonGroup

**Import from:** `shell/components/ButtonGroup.vue`
**Also known as:** Segmented control · Toggle buttons · Visual radio buttons

A horizontal group of mutually exclusive buttons acting like a visual radio group. Used to switch between views or filter modes where all options need to be visible simultaneously.

**Key props:**
- `value` (required) — Currently active option value
- `options` (Array, required) — `[{ label, value }]` or plain string array
- `size` (String) — `small` · `medium` · `large`
- `activeClass` (String) — CSS class applied to the selected button
- `inactiveClass` (String) — CSS class applied to unselected buttons
- `disabled` (Boolean)

**Events:** `@update:value`

**Best practices:**
- Use for 2–4 mutually exclusive options that should all be visible at once (e.g., Grid / List, Cluster / Project)
- Keep labels to 1–2 words
- Place in the `Masthead` toolbar or above a data table for view-mode switching

**Anti-patterns:**
- Don't use for more than 4 options — use `LabeledSelect` instead
- Don't use for form field inputs — use `RadioGroup`

---

## ActionMenu

**Import from:** `shell/components/ActionMenu.vue`
**Also known as:** Kebab menu · Context menu · More actions

A popup menu of actions for a specific resource or selected rows. `SortableTable` and `ResourceTable` instantiate this automatically for every row — do not add it manually unless building a custom row layout.

**Key props:**
- `customActions` (Array) — Override or extend the default resource actions
- `open` (Boolean) — Controlled open state

**Events:** `@close`, `@action-invoked`

**Best practices:**
- Rely on `SortableTable`'s built-in action integration — `ActionMenu` renders automatically
- Use `customActions` only to add non-standard actions that the resource store does not provide
- Place destructive actions (Delete) at the bottom of the list, visually separated from non-destructive ones

**Anti-patterns:**
- Don't build a custom dropdown for resource row actions — the `ActionMenu` system handles RBAC and bulk selection automatically

---

## RcDropdown

**Import from:** `pkg/rancher-components/src/components/RcDropdown/RcDropdown.vue`
**Also known as:** Dropdown menu · Popover menu

A composable floating dropdown menu. Use for non-resource-row action menus (for row-level resource actions, use `ActionMenu`).

**Sub-components:** `RcDropdownTrigger`, `RcDropdownMenu`, `RcDropdownItem`, `RcDropdownItemSelect`, `RcDropdownItemCheckbox`, `RcDropdownSeparator`

**Key props:**
- `ariaLabel` (String) — Accessible label for the trigger button
- `placement` (String, default: `'bottom-end'`) — Floating placement relative to the trigger
- `distance` (Number) — Gap in pixels between trigger and menu

**Events:** `@update:open`

**Slots:** `#dropdownCollection` — the menu item content

**Best practices:**
- Use `RcDropdownSeparator` to group related actions visually
- Use `RcDropdownItemCheckbox` for toggleable settings inside the dropdown
- Always set `ariaLabel` — the trigger button must have an accessible name

**Anti-patterns:**
- Don't use `RcDropdown` for resource row actions — use `ActionMenu`
- Don't put more than 8 items in a single dropdown without a separator

---

## Drawer

**Import from:** `shell/components/Drawer/Chrome.vue`
**Also known as:** Side panel · Slide-out panel · Detail panel

A slide-out panel anchored to the right side of the screen. Used to surface resource details, configuration previews, or help content without navigating away from the current page.

**Key props:**
- `ariaTarget` (String, required) — ID of the element that triggered the drawer; used to return focus on close
- `removeFooter` (Boolean) — Hide the footer slot

**Events:** `@close`

**Slots:** `#header`, `#title`, `#body`, `#footer`, `#additional-actions`

**Best practices:**
- Use when the user benefits from seeing the main page and the panel simultaneously (e.g., inspecting an item while the list remains visible)
- Always handle `@close` and return focus to the trigger element (`ariaTarget`) — keyboard users need focus restored
- Use `#additional-actions` for secondary controls that should not compete visually with the primary `#footer` actions
- Limit panel width to 40–50% of the viewport; content needing more space warrants a full page

**Anti-patterns:**
- Don't embed a full edit form inside a Drawer — navigate to the edit page or use a modal
- Don't use Drawer as a replacement for a dialog — dialogs block decisions, drawers provide supplementary context

---

## Window

**Import from:** `shell/components/Window/Window.vue`
**Also known as:** Float window · Log window · Shell window · Terminal window

A floating, focusable window container managed by `WindowManager`. Hosts terminal shells (`ContainerShell`), log streams (`ContainerLogs`), and documentation viewers (`ChartReadme`). Never instantiate directly — always use through the store-driven `WindowManager` system.

**Key props:**
- `active` (Boolean, required) — Whether this window is currently focused
- `afterOpen` (Function) — Callback fired after the window opens
- `activated` (Function) — Callback when the window gains focus
- `deactivated` (Function) — Callback when the window loses focus
- `beforeClose` (Function) — Callback before close; return `false` to cancel

**Slots:** `#title`, `#body`

**Best practices:**
- Always open windows via `this.$store.dispatch('wm/open', { id, component, ... })` — do not instantiate `Window` directly
- Use `beforeClose` to prompt the user before closing an active terminal session
- Keep `#title` to one line — the window chrome has limited header height
- `WindowManager` tracks window identity by `id` — use a stable, resource-scoped ID to prevent duplicate windows

**Anti-patterns:**
- Don't use `Window` for confirmations or data input — use a dialog or Drawer
- Don't create multiple windows for the same resource instance — check if one already exists before dispatching

---

## RcIcon

**Import from:** `pkg/rancher-components/src/components/RcIcon/RcIcon.vue`
**Also known as:** Icon

Renders a single icon with semantic status coloring and size variants.

**Key props:**
- `type` (String) — Icon identifier
- `size` (String) — `small` · `medium` · `large`
- `status` (String) — `inherit` · `success` · `warning` · `error` · `info`
- `ariaHidden` (Boolean) — Hide from screen readers when decorative

**Best practices:**
- Set `ariaHidden: true` when the icon is decorative and adjacent text already conveys the meaning
- Use `status` for semantic color coding instead of applying raw CSS color classes
- Use `size="small"` for inline text icons, `size="large"` for standalone call-to-action icons

---

## RcItemCard

**Import from:** `pkg/rancher-components/src/components/RcItemCard/RcItemCard.vue`
**Also known as:** Item card · Catalog card · Extension card

A card variant styled for catalog-style item grids (extensions, charts, integrations). Renders a thumbnail image/icon, title, description pills, and action buttons.

**Key props:**
- `variant` (String) — `small` · `medium` — controls card dimensions
- `label` (String) — Card title
- Image config — `{ src, icon }` for the card thumbnail
- Pill badges — array of badge config objects
- Actions — array of action button configs

**Best practices:**
- Use `variant="small"` for dense grids (6+ cards per row)
- Use `variant="medium"` for featured or primary item displays (2–3 per row)
- Keep the title to one line; push detail into the card body or a tooltip

**Anti-patterns:**
- Don't use `RcItemCard` for data table rows — use `SortableTable`
- Don't use for resource status cards — compose `BadgeState` + `Card` instead

---

## RcTag

**Import from:** `pkg/rancher-components/src/components/Pill/RcTag/RcTag.vue`
**Also known as:** Pill · Tag · Chip

A small inline tag used for decorative labels, filter chips, or removable items. Use `BadgeState` for semantic resource-state indicators; use `RcTag` for arbitrary user-defined or UI-driven labels.

**Key props:**
- `type` (String, required) — Visual variant from the `RcTagType` enum
- `disabled` (Boolean, default: `false`)
- `showClose` (Boolean, default: `false`) — Render a close/remove button
- `closeAriaLabel` (String) — Accessible label for the close button
- `highlight` (Boolean) — Apply a highlighted/selected appearance

**Events:** `@close` — Fired when the close button is clicked

**Slots:** Default — tag label content

**Best practices:**
- Use `showClose: true` for removable filter chips or editable tag collections
- Always set `closeAriaLabel` when `showClose` is true — screen readers need an explicit label for the close action
- Use `highlight` to indicate a selected/active filter state
- Use alongside `StringList` or `LabeledSelect` (taggable mode) for tag input patterns

**Anti-patterns:**
- Don't use `RcTag` for Kubernetes resource state — use `BadgeState` which is semantically correct and color-consistent
- Don't use `RcTag` as a button — it conveys category/label, not action

---

## LabeledTooltip

**Import from:** `pkg/rancher-components/src/components/LabeledTooltip/LabeledTooltip.vue`
**Also known as:** Form tooltip · Info tooltip

A tooltip variant optimised for form labels. Surfaces supplementary field explanation without cluttering the layout.

**Best practices:**
- Trigger on hover only — never require a click to read a field explanation
- Keep content under two sentences; longer explanations belong in external documentation links
- Pair with a `(?)` icon adjacent to the form label

**Anti-patterns:**
- Don't use for essential information — if users need it to complete the form, show it inline as helper text instead

---

## Security & Dashboard Primitives

Shell ships nothing for severity levels, CVE scores or scan status — no colour tokens, no severity badge, no segmented severity bar. The primitives below are the sanctioned fill-in, taken from **SUSE Security** (`rancher/security-ui-exts`, `pkg/vulnerability-scanner`). It is the most recent sanctioned Rancher work on this kind of screen, so use it whenever an extension needs an overview or security dashboard.

Verified against commit [`c1a1dbac`](https://github.com/rancher/security-ui-exts/tree/c1a1dbac5fa7962247c4777c2521b646c855c693/pkg/vulnerability-scanner), which was `main` on 2026-10-13. Check `main` for newer work before copying.

**None of these are importable.** There is no package to pull them from — you rebuild them in your own extension. **Copy the look and the dimensions, not the code:** the originals are Options API with `$fetchState` and must be rewritten as `<script setup lang="ts">` (rule #7). Where a shell component already does the job (`BadgeState`, `Banner`, `SortableTable`, `LabeledSelect`), use the shell one.

Also skip, when copying: the `font-family: Lato` declarations (shell already uses Lato app-wide) and the hex `.btn-link` colours (`#007cbb` / `#007cba` / `#005a8b`) — use shell link styles.

For the page layouts these primitives sit in — summary strips, top-N lists, dashboard headers, empty states — see **Overview & Security Dashboards** in `rancher-ui-patterns.md`.

---

## Severity & Status Palette

**Reference implementation:** `pkg/vulnerability-scanner/styles/_variables.scss`
**Also known as:** Severity colours · CVE colours · Scan status colours

Severity and scan-status colours are **the one allowed custom palette** (rule #4 in `SKILL.md`). Shell has no severity tokens, and reusing SUSE Security's values keeps severity consistent across SUSE products. Define it once in your extension, handle `body.theme-dark`, and don't invent a second one.

```scss
// Base colour palette
$dark-red:          #A30000;
$red:               #E03231;
$orange:            #FD8D0D;
$yellow:            #FADA38;
$light-gray:        #C3C6D5;
$dark-gray:         #4A4B52;
$very-light-gray:   #DDDEE7;
$info-blue:         #0C6AE8;
$aqua:              #0FCFF0;
$blue:              #3E98D3;
$icon-disabled-gray:#E2E3EB;
$green:             #5D9A5D;
$unavailable-gray:  #BFC1D5;

// Severity (badge) colours
$critical-color: $dark-red;
$high-color:     $red;
$medium-color:   $orange;
$low-color:      $yellow;
$na-color:       $light-gray;   // unknown / n/a
$low-na-text:    $dark-gray;    // text on low + unknown

// Scan status colours
$pending-color:    $light-gray;
$scheduled-color:  $aqua;
$inprogress-color: $blue;
$completed-color:  $green;
$failed-color:     $red;

// Empty ("zero") segments — theme-aware
$zero-color-light: $very-light-gray;
$zero-color-dark:  $dark-gray;
$zero-text:        var(--disabled-text);
```

**Best practices:**
- Expose the SCSS values as CSS custom properties when a component needs to pick a colour by key at runtime (`--cve-critical`, `--status-complete`, …) — that is how `BarChart` feeds `color-stops`
- Everything that is *not* severity or scan status still comes from the shell tokens in `rancher-ui-styling.md`
- Always pair a `$zero-color-light` background with a `body.theme-dark &` override to `$zero-color-dark`
- Keep `--disabled-text` and the other shell theme variables for text, borders and backgrounds; only severity/status hues come from this palette

**Anti-patterns:**
- Don't hard-code `#141419`, `#DCDEE7` or `#FFF` for text/border/background — they break dark mode (this is exactly what `pages/.../Vulnerabilities.vue` does; see the source map in `rancher-ui-patterns.md`)
- **Contrast:** low (yellow) and unknown (light grey) always get **dark** text (`$low-na-text`). Never print yellow text on a light background, e.g. "254 / 551 / 642" with a yellow 551
- Don't introduce a second severity scale for a different resource type — one palette, app-wide

---

## Stat Block

**Reference implementation:** the "Scanning status" panel in `pkg/vulnerability-scanner/pages/c/_cluster/vulnerability-scanner/Dashboard.vue`
**Also known as:** KPI tile · Big number · Metric block

Big number, muted label underneath, centred, spread evenly across the section. Colour a value only when it carries meaning, such as failures or errors. Put an optional muted total in the section header, on the right ("1575 images").

```vue
<div class="stats">
  <div class="stat">
    <div class="stat-value">{{ total }}</div>
    <div class="stat-label">{{ t('myext.overview.total') }}</div>
  </div>
  <div class="stat">
    <div class="stat-value text-warning">{{ failed }}</div>
    <div class="stat-label">{{ t('myext.overview.failed') }}</div>
  </div>
  <div class="stat">
    <div class="stat-value text-error">{{ errors }}</div>
    <div class="stat-label">{{ t('myext.overview.errors') }}</div>
  </div>
</div>
```

```scss
.stats { display: flex; justify-content: space-between; align-items: flex-start; gap: 32px; padding: 24px 0; }
.stat { flex: 1; display: flex; flex-direction: column; gap: 8px; text-align: center; }
.stat-value { font-size: 28px; font-weight: 700; line-height: 36px; }
.stat-label { font-size: 14px; line-height: 20px; font-weight: 400; color: var(--disabled-text); }
```

**Best practices:**
- Pluralise the value text through i18n (`t('typeLabel.image', { count }, true)`), so "1 image" / "2 images" both read correctly
- A stat whose value is an elapsed time ("12 minutes") can drop its label when there is no meaningful timestamp yet — render the label with `v-if`
- Keep every stat in the row the same shape: one number, one label

**Anti-patterns:**
- Don't hard-code the warning/error hues. SUSE Security uses `#f59e0b` and `#dc2626` here; use the shell `text-warning` / `text-error` classes instead
- Don't colour every stat — if all three are coloured, none of them reads as the exception

---

## Distribution Chart

**Reference implementation:** `pkg/vulnerability-scanner/components/DistributionChart.vue` → `components/common/BarChart.vue`
**Also known as:** Severity distribution · Status distribution · Category bar list

A total on the left and one labelled bar per category on the right. Used for severity breakdowns (image detail) and scan-status breakdowns (registries page).

**Structure:**
- **Left (`flex: 1`, 160px):** big total (24px, weight 800) with a muted, pluralised label under it ("1575 vulnerabilities"), both centred
- **Right (`flex: 3`):** one row per category — **label** (80px, underlined, clickable, filters the table below) · **thin bar** (7px) · **count** (muted, right-aligned, 50px), 12px gaps
- Show categories even when they are 0, so the layout doesn't shift

**Wrapper props** (`DistributionChart`): `title` (required), `chartData` (required object, `{ category: count }`), `colorPrefix` (required — `cve` or `status`; selects the CSS variable family and the i18n enum), `typeLabel` (required — pluralisation key), `filterFn` (optional callback), `tooltip` (optional).

```vue
<div class="distribution">
  <div class="distribution-total">
    <span class="distribution-total-value">{{ total }}</span>
    <span class="text-muted">{{ t('myext.vulnerabilities', { count: total }, true) }}</span>
  </div>
  <div class="distribution-rows">
    <div v-for="s in severities" :key="s.key" class="distribution-row">
      <a class="distribution-label" href="#" @click.prevent="emit('filter', s.key)">{{ s.label }}</a>
      <div class="distribution-track"><div class="distribution-fill" :class="s.key" :style="{ width: `${ pct(s.value) }%` }" /></div>
      <span class="distribution-count text-muted">{{ s.value }}</span>
    </div>
  </div>
</div>
```

```scss
.distribution { display: flex; align-items: flex-start; gap: 24px; padding: 8px 0; align-self: stretch; }
.distribution-total { flex: 1; width: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
.distribution-total-value { font-size: 24px; font-weight: 800; }
.distribution-rows { flex: 3; display: flex; flex-direction: column; gap: 4px; }
.distribution-row { display: flex; align-items: center; gap: 12px; margin: 2px 0; }
.distribution-label { width: 80px; text-decoration: underline; cursor: pointer; }
.distribution-track { flex: 1; height: 7px; border-radius: 4px; background: var(--progress-bg); overflow: hidden; }
.distribution-fill { height: 100%; }
.distribution-count { width: 50px; text-align: right; color: var(--disabled-text); }
```

**Best practices:**
- Make the category label a real link or button — it is the filter control for the table underneath, and underline + pointer is the only affordance it has
- Drive the bar colour from a CSS custom property keyed by category (`--cve-critical`, `--status-complete`), so one template serves both severity and status
- Guard the percentage against a zero total — return `0`, not `NaN`

**Anti-patterns:**
- Don't fork shell's `PercentageBar` just to get a thinner bar. SUSE Security did (`components/rancher-rewritten/shell/components/PercentageBar.vue` + `graph/Bar.vue`), and the only change is a `height` prop — a plain div track like the one above avoids the fork. See [Percentage Bar Variants](#percentage-bar-variants)
- Don't hide zero-count categories — the row heights shift every refresh

---

## Severity Amount Bar

**Reference implementation:** `pkg/vulnerability-scanner/components/common/AmountBarBySeverity.vue`, `AmountBarBySeverityPoppedDetail.vue`, `formatters/IdentifiedCVEsCell.vue`
**Also known as:** CVE count bar · Severity segments · Severity strip

Shows the count of findings at every severity in one horizontal control. Comes in two forms, switched by one prop.

**Key props:**
- `cveAmount` (Object, default `{}`) — counts keyed by severity: `{ critical, high, medium, low, unknown }`
- `isCollapsed` (Boolean, default `false`) — switch from the expanded strip to the dense stacked bar

**Expanded** (`isCollapsed: false`) — a 24px segmented strip, one equal-width segment per severity in order critical → high → medium → low → unknown. Each segment prints its count; zero segments go grey (theme-aware). Use it in top-N lists and in table cells that have room.

```vue
<div class="sev-bar">
  <div v-for="s in SEVERITIES" :key="s" class="sev-seg" :class="counts[s] ? s : 'zero'">{{ counts[s] || 0 }}</div>
</div>
```

```scss
@import '../styles/_variables.scss';

.sev-bar { display: flex; align-items: center; height: 24px; border-radius: 4px; overflow: hidden; text-align: center; }
.sev-seg { flex: 1 0 0; align-self: stretch; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 20px; padding: 0 2px; }
.sev-seg.critical { background: $critical-color; color: rgba(255, 255, 255, 0.9); }
.sev-seg.high     { background: $high-color;     color: rgba(255, 255, 255, 0.9); }
.sev-seg.medium   { background: $medium-color;   color: rgba(255, 255, 255, 0.9); }
.sev-seg.low      { background: $low-color;      color: $low-na-text; }
.sev-seg.unknown  { background: $na-color;       color: $low-na-text; }
.sev-seg.zero     { background: $zero-color-light; color: var(--disabled-text); body.theme-dark & { background: $zero-color-dark; } }
```

**Collapsed** (`isCollapsed: true`) — a 7px stacked percentage bar (see [Percentage Bar Variants](#percentage-bar-variants)), each segment sized by its share of the total. Use it in dense tables, wrapped in the hover popover below.

**Hover popover** (`AmountBarBySeverityPoppedDetail`) — wraps the collapsed bar in a 140px cell; on hover it shows a 350px panel:
- header: "*N* affected CVEs" (or a `headerTitle` override) on the left, a "View all" router link on the right
- one row per severity: 80px underlined label link → 8px rounded track → 35px right-aligned count
- a severity with a count of 0 renders its label as a dead link (`pointer-events: none`, muted, no underline)
- the panel flips above the trigger when there is less than 300px below it, and right-aligns when there is less than 370px to the right
- surfaces use `var(--popover-bg)` / `var(--popover-border)`

**Best practices:**
- Each severity label in the popover links to the list filtered by that severity — pass the filter through the route query, not component state
- Use the expanded form in the first column of a summary list, the collapsed+popover form inside `SortableTable` cells
- Order severities critical → high → medium → low → unknown everywhere, including the popover

**Anti-patterns:**
- Don't print white text on the low (yellow) or unknown (light grey) segments — they always take `$low-na-text`
- Don't drop zero segments to save width; the grey segment is what makes "no criticals" readable at a glance

---

## Score Badge

**Reference implementation:** `pkg/vulnerability-scanner/components/common/ScoreBadge.vue`
**Also known as:** CVSS badge · Severity score chip

A fixed-width badge showing a CVSS score and its version, coloured by severity: `9.8 (v3)`.

**Key props:**
- `score` (String) — the numeric score as text; empty renders `n/a`
- `scoreType` (String) — version suffix, rendered in brackets (`v3`)
- `severity` (String) — drives the background; anything unrecognised, or a missing score, falls back to the grey `n/a` style

**Dimensions:** 96px wide, `border-radius: 4px`, centred, 13px text on a 24px line, stretches to the row height.

**Colour mapping:** `critical`/`high`/`medium` → severity colour with `rgba(255,255,255,0.9)` text; `low` → `$low-color` with `$low-na-text`; anything else → `$na-color` with `$low-na-text`.

**Best practices:**
- Keep the width fixed so score columns align down a list — that is the whole point of the 96px
- Render `n/a` rather than an empty badge when a CVE has no score; an empty coloured box reads as a rendering bug
- Split the stored score string once (`"9.8 (v3)"` → score + type) rather than in the template

**Anti-patterns:**
- Don't reuse `BadgeState` for scores — it is for Kubernetes resource state and its colours are state colours
- Don't let the badge grow with the text; long scores should never reflow the column

---

## Status Pill

**Reference implementation:** `pkg/vulnerability-scanner/components/common/StatusBadge.vue`
**Also known as:** Scan status badge · Pipeline status pill

A pill for non-Kubernetes workflow states — scan status and VEX enablement.

**Key props:**
- `status` (String, default `''`) — the raw status value; the component maps it to a style class and to the `…enum.status.<lowercased>` translation key. An unknown value renders an empty pill with muted text

**Dimensions:** `border-radius: 30px`, `padding: 1px 8px`, 12px text on a 19px line, clamped to one line with ellipsis.

**Colour mapping:**

| Status | Background | Text |
|---|---|---|
| `pending` | `$pending-color` at 30% alpha | 65% black (65% white in dark mode) |
| `scheduled` | `$scheduled-color` at 30% alpha | 65% black / white |
| `in-progress` | `$inprogress-color` at 30% alpha | 65% black / white |
| `complete` | `$completed-color` at 30% alpha | 65% black / white |
| `enabled` (VEX) | `$completed-color` at 30% alpha | 65% black / white |
| `failed` | solid `$failed-color` | white |
| `disabled` (VEX) | solid `$failed-color` | white |

**Best practices:**
- Reserve the solid-red treatment for the states that need to stop the eye (failed, disabled); everything else stays at 30% alpha
- Drive the label from a translation key built off the status value, so a new backend status degrades to a missing-key warning rather than a wrong label
- Use for scan status to match SUSE Security

**Anti-patterns:**
- Don't use this for generic Kubernetes states — shell `BadgeState` is still the right choice there
- Don't put a `StateDot` next to it; the pill already carries the colour and the label

---

## Fix Available Icon

**Reference implementation:** `pkg/vulnerability-scanner/components/common/FixAvailableIcon.vue`
**Also known as:** Remediation indicator

A single icon column telling the user whether a fixed version exists.

**Key props:**
- `fixAvailable` (Boolean, default `false`)

```vue
<i :class="fixAvailable ? 'icon icon-confirmation-alt' : 'icon icon-notify-error'" />
```

`1.5rem`, `$info-blue` when a fix exists, `$unavailable-gray` when it does not.

**Best practices:**
- Give the icon an accessible label or a tooltip — colour and glyph alone fail WCAG, and this is usually a 40px column with no header text
- Keep it in its own fixed-width column so the rows line up

**Anti-patterns:**
- Don't use `text-success` green here; "a fix exists" is information, not health

---

## Info Tooltip

**Reference implementation:** `pkg/vulnerability-scanner/components/common/Tooltip.vue`
**Also known as:** Section help icon

The small `(?)` icon that sits next to a dashboard section title.

```vue
<i v-if="tooltip" v-clean-tooltip="tooltip" class="icon icon-question-mark" />
```

Coloured `var(--disabled-text)`, 8px after the title.

**Best practices:**
- SUSE Security wraps this in a local `Tooltip.vue`; in an extension `v-clean-tooltip` on an `icon-question-mark` does the same thing with shell only — no component needed
- Pass a translation key's output, never a literal string
- Render nothing when there is no tooltip text, rather than an icon with an empty bubble

**Anti-patterns:**
- Don't use it for essential information — a dashboard section whose meaning lives in a tooltip needs a better title
- For form fields use `LabeledTooltip` or the `tooltip`/`tooltipKey` props on the input instead

---

## Percentage Bar Variants

Four different bars are in play across shell and SUSE Security. Pick deliberately.

| Bar | Where | Props | Shape |
|---|---|---|---|
| `PercentageBar` | `shell/components/PercentageBar.vue` (wraps `shell/components/graph/Bar.vue`) | `modelValue` (required, 0–100), `preferredDirection` (`LESS`\|`MORE`), `showPercentage`, `colorStops`, `slices` | Fixed 15px, fully rounded. Auto-colours `--primary` / `--error` against an 80% (or 20%) threshold unless `colorStops` overrides it |
| `PercentageBar` | `shell/components/Resource/Detail/PercentageBar.vue` | `percent`, `percentageColor` (default `var(--primary)`), `baseColor` (default `var(--progress-bg)`) | 16px, `--border-radius-md`. The one used by detail-page cards — see **Detail Page Masthead** in `rancher-ui-patterns.md` |
| `StackedPercentageBar` | SUSE Security `components/common/StackedPercentageBar.vue` | `percentages` (required array summing to ≤ 100), `primaryClasses` (array, one class per segment), `secondaryColor` (default `--border`), `height` (default 15) | Multi-segment bar; radius follows `height / 2`. Backs the collapsed [Severity Amount Bar](#severity-amount-bar) at `height: 7` |
| `BlockPercentageBar` | SUSE Security `components/common/BlockPercentageBar.vue` | `percentage` (required, 0–100), `eventHandler` (required function, used to register a resize listener) | 16px tall row of 4px blocks with 3px gaps; block count is computed from the measured container width, so it needs a resize hook |

**Best practices:**
- Default to the shell bars. Reach for the SUSE Security ones only for a stacked severity bar or the blocky "impacted images" look
- `StackedPercentageBar` validates that the percentages sum to ≤ 100 — normalise before passing, and return all zeros when the total is 0
- Give `BlockPercentageBar` a real `eventHandler`; without one it never recalculates on resize (the reference implementation leaves its own debounce commented out and has an empty `beforeUnmount`, so it leaks the listener — fix that when you copy it)

**Anti-patterns:**
- Don't fork shell's `PercentageBar`/`Bar` just to change the height — the fork in `components/rancher-rewritten/` adds exactly one `height` prop (and renames `modelValue` to `value`). A plain styled div, or `StackedPercentageBar`, is cheaper than carrying a fork
- Don't hard-code block colours (`#EDEFF3` / `#BEC1D2` in `BlockPercentageBar`) — map them to theme variables
