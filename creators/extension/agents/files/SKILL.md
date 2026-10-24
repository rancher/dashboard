---
name: rancher-ui-extension
description: Build, extend, refactor and debug Rancher UI Extensions — scaffold a new one, add or change screens in an existing one, validate before shipping. Use whenever the user is working on a Rancher extension, Rancher Dashboard extension, or Rancher UI plugin, including - creating or scaffolding a new extension; adding or editing a page, view, screen, list, detail, edit form, tab, panel, card, action, table column, masthead or nav entry; refactoring, restyling or redesigning an existing extension screen; wiring a custom resource, CRD, model or model extension; product registration and routing; shell API usage (modal, slide-in, notification, proxy, Vuex store); translations, styling, spacing, colour tokens or design-system questions in the Rancher UI; unit tests, linting, or a failing yarn build-pkg; an extension that will not load or a custom list/detail/edit view that is not being picked up; package.json annotations, version gating, support matrix and publishing. Also applies to any task inside a repo containing pkg/<name>/index.ts that depends on @rancher/shell.
argument-hint: Optional — what to build or change (may be empty when the skill self-triggers)
---

# Rancher UI Extension Builder

A skill for building Rancher UI Extensions correctly, consistently, and in line with SUSE's UX standards.

## Documentation map

**The docs are the source of truth, not this file.** Rancher's extension APIs change between releases; this skill does not. When a topic below has a docs link, **fetch it** rather than relying on any snippet reproduced here. Snippets in this file exist only where no docs page covers the topic, and should be treated as a starting point to verify, not as an authority.

Base: `https://extensions.rancher.io/extensions/next/`

| Need | Page |
|---|---|
| **Start here, always** | [`api/overview`](https://extensions.rancher.io/extensions/next/api/overview) — index of the entire Extensions API |
| Scaffolding a new extension | [`extensions-getting-started`](https://extensions.rancher.io/extensions/next/extensions-getting-started) |
| **Product registration (default)** | [`api/nav/product-registration`](https://extensions.rancher.io/extensions/next/api/nav/product-registration) + [`usecases/product-registration-examples`](https://extensions.rancher.io/extensions/next/usecases/product-registration-examples) |
| Product registration, pre-2.15 fallback | [`api/nav/products`](https://extensions.rancher.io/extensions/next/api/nav/products), [`nav/side-menu`](https://extensions.rancher.io/extensions/next/api/nav/side-menu), [`nav/routing`](https://extensions.rancher.io/extensions/next/api/nav/routing), [`nav/custom-page`](https://extensions.rancher.io/extensions/next/api/nav/custom-page), [`nav/resource-page`](https://extensions.rancher.io/extensions/next/api/nav/resource-page) |
| Folder layout & what each folder does | [`folder-structure`](https://extensions.rancher.io/extensions/next/folder-structure) |
| Auto-import / `register` | [`api/components/auto-import`](https://extensions.rancher.io/extensions/next/api/components/auto-import), [`api/components`](https://extensions.rancher.io/extensions/next/api/components) |
| Resource models, custom list/detail/edit | [`folder-structure#models`](https://extensions.rancher.io/extensions/next/folder-structure#models), [`api/components/resources`](https://extensions.rancher.io/extensions/next/api/components/resources) |
| Model extensions (`addModelExtension`) | [`provisioning/overview#models`](https://extensions.rancher.io/extensions/next/provisioning/overview#models) |
| Injecting into existing pages | [`api/actions`](https://extensions.rancher.io/extensions/next/api/actions), [`api/tabs`](https://extensions.rancher.io/extensions/next/api/tabs), [`api/panels`](https://extensions.rancher.io/extensions/next/api/panels), [`api/cards`](https://extensions.rancher.io/extensions/next/api/cards), [`api/table-columns`](https://extensions.rancher.io/extensions/next/api/table-columns), [`api/table`](https://extensions.rancher.io/extensions/next/api/table) — all scoped by [`api/common`](https://extensions.rancher.io/extensions/next/api/common) |
| Modals, slide-ins, notifications | [`shell-api/interfaces/ModalApi`](https://extensions.rancher.io/extensions/next/shell-api/interfaces/ModalApi), [`SlideInApi`](https://extensions.rancher.io/extensions/next/shell-api/interfaces/SlideInApi), [`NotificationApi`](https://extensions.rancher.io/extensions/next/shell-api/interfaces/NotificationApi) |
| Fetching / mutating resources | [`resources-api`](https://extensions.rancher.io/extensions/next/resources-api) |
| Custom Vuex store | [`advanced/stores`](https://extensions.rancher.io/extensions/next/advanced/stores) |
| Nav hooks / lifecycle | [`advanced/hooks`](https://extensions.rancher.io/extensions/next/advanced/hooks) |
| Proxying third-party APIs | [`provisioning/node-driver/proxying`](https://extensions.rancher.io/extensions/next/provisioning/node-driver/proxying) |
| Translations | [`advanced/localization`](https://extensions.rancher.io/extensions/next/advanced/localization) |
| `package.json` annotations, version gating | [`configuration`](https://extensions.rancher.io/extensions/next/configuration), [`advanced/version-compatibility`](https://extensions.rancher.io/extensions/next/advanced/version-compatibility) |
| **Which APIs exist in which Rancher version** | [`support-matrix`](https://extensions.rancher.io/extensions/next/support-matrix) — check before using anything new |
| Linting | [`linting`](https://extensions.rancher.io/extensions/next/linting) |
| Unit tests | [`unit-testing`](https://extensions.rancher.io/extensions/next/unit-testing) |
| Publishing | [`publishing`](https://extensions.rancher.io/extensions/next/publishing) |
| When something doesn't load | [`troubleshooting`](https://extensions.rancher.io/extensions/next/troubleshooting) |

**Component reference:**
- **Live Storybook — https://rancher.github.io/storybook/** — rendered components with live props. Prefer this over any written list.
- `rancher-ui-components.md` (local) — props, best practices, anti-patterns for 38 components. Useful offline; verify props against Storybook or source if behaviour surprises you.
- `rancher-ui-patterns.md` (local) — composition patterns for list pages, forms, detail views and their mastheads (title bar → metadata → cards), dialogs.
- `rancher-ui-styling.md` (local) — the design-token layer: colour tokens, spacing scales and helper classes, radius, typography, the column grid, breakpoints, z-index, SCSS mixins.

**Working code:**  — maintained alongside the API, unlike the shipped extensions below on "Reference Implementations."

**Reference implementations** (style, coding & patterns — read when needed, not all upfront):
- SUSE Virtualization: https://github.com/harvester/harvester-ui-extension
- SUSE AI Assistant: https://github.com/rancher/rancher-ai-ui
- SUSE Virtual Clusters: https://github.com/rancher/virtual-clusters-ui
- SUSE Security Admission Controller: https://github.com/rancher/kubewarden-ui
- SUSE Security (vulnerability scanner, runtime enforcer): https://github.com/rancher/security-ui-exts — best reference for overview and security dashboards (summary strips, severity bars, top-N CVE lists, scan status). Distilled in `rancher-ui-patterns.md` (layouts) and `rancher-ui-components.md` (primitives and palette). Options API, so copy the look, not the code.
- Operator dependency pattern: https://github.com/rancher/elemental-ui
- Dashboard (best for UI/UX patterns as it provides a ton of UI's with sanctioned UX patterns): https://github.com/rancher/dashboard
- Examples repo: https://github.com/rancher/ui-plugin-examples

---

## Non-negotiable rules

Before writing a single line of code, burn these into context — they are the most common failure modes:

0. **Docs over memory.** Before using any API, fetch its page from the documentation map above and check the [support matrix](https://extensions.rancher.io/extensions/next/support-matrix) against the target Rancher version. If a snippet in this skill disagrees with the docs, the docs win — and say so in your summary so the skill can be corrected.

1. **Register products with the Product Registration API.** It generates routes and the `product`/`virtualType`/`configureType`/`basicType` DSL for you. It is the default for every new extension.

   Read before writing: [`api/nav/product-registration`](https://extensions.rancher.io/extensions/next/api/nav/product-registration) for the signatures (`addProduct` is overloaded — name-only, product + children, single-page — plus `extendProduct` for Explorer/Manager/Settings/Auth), and [`usecases/product-registration-examples`](https://extensions.rancher.io/extensions/next/usecases/product-registration-examples) for copy-paste-ready configs. Don't reproduce the shapes from memory; they're typed and the docs track the types.

   **Fall back to the legacy DSL** ([`api/nav/products`](https://extensions.rancher.io/extensions/next/api/nav/products)) **only if one of these holds:**
   - the extension must run on **Rancher older than 2.15**, where the Product Registration API is unavailable; or
   - you hit a **concrete bug or constraint** in the new API that it cannot express — state what you tried, in the Phase 8 summary.

   The API is marked *Experimental*, so pin `catalog.cattle.io/rancher-version: ">= 2.15.0-0"` when you use it.

   ⚠️ Every shipped extension below (kubewarden, harvester, virtual-clusters, ali, rancher-ai, capa) predates this API and uses the DSL. Read them for models and components — **not** for product registration.

2. **Always prioritise shell and rancher components.** For every UI element, check in this order:
   - **https://rancher.github.io/storybook/** — browse what exists before deciding anything is missing
   - `@shell/components/...` (source: https://github.com/rancher/dashboard/tree/master/shell/components)
   - `@components/...` — the alias is `@components`, **not** `@rancher/components` (source: https://github.com/rancher/dashboard/tree/master/pkg/rancher-components/src/components)
   - Only if neither satisfies the UX need, create a custom component — match the look, feel, spacing, and color tokens of the existing shell components exactly (`rancher-ui-styling.md`).

3. **Don't create new components lightly.** Always check if an existing shell or rancher component can fulfill the requirement before creating a new one. New components should only be introduced when absolutely necessary and must adhere to the established design patterns and guidelines.

4. **Don't create new color tokens lightly.** Always check if an existing shell or rancher color token can fulfill the requirement before introducing a new one — `rancher-ui-styling.md` has the full inventory. New color tokens should only be added when absolutely necessary and must adhere to the established design system. The one exception is severity and scan-status colours: shell has none, so reuse the SUSE Security palette in `rancher-ui-components.md` ("Severity & Status Palette") instead of inventing one.

5. **Operator/chart dependency guard.** If any screen or flow requires a Helm chart or operator to be installed, show a blocking dashboard screen first (like the Elemental UI pattern) — a banner or empty state with a clear install CTA. Never render broken/empty resource screens without this guard.

6. **User permission scoping.** Standard users may not have access to downstream clusters or cluster-scoped resources. For each screen, check what role is required and either hide the feature or show a clear "insufficient permissions" message.

7. **TypeScript + Composition API, always.** Vue 3 throughout. Write every new component as `<script setup lang="ts">`.

   Some shell CRUD scaffolding is still Options API with mixins (`CruResource` + `CreateEditView`, `FormValidation`, `ResourceFetch`). **That is unmigrated tech debt, not a pattern to copy.** Where you must consume one of those mixins, keep the Options API wrapper as thin as possible and push real logic into typed composables. Never write a new Options API component just because a nearby file is one.

8. **Zero tolerance for build errors.** The extension must ship with no TypeScript errors, no ESLint errors, and a successful `yarn build-pkg` before you declare it done.

9. **Handle strings as translations.** Never hard-code strings. See [`advanced/localization`](https://extensions.rancher.io/extensions/next/advanced/localization).

   Two things to get right: prefer the `labelKey`/`tooltipKey` prop variants (which take a translation key) over `label`/`tooltip` (which take literal text); and **prefix every key with your product name** — duplicate keys overwrite shell translations across the entire app, not just your extension.

10. **`{{ t(...) }}` double-escapes. Use a non-escaping `t` in your own components.**

    Shell installs `t` as a global property (`@rancher/shell/plugins/i18n.js`). It ends in `escapeHtml(out)` unless you pass a third `raw` argument:

    ```js
    // @rancher/shell/plugins/i18n.js
    export function stringFor(store, key, args, raw = false, escapehtml = true) {
      const translation = store.getters['i18n/t'](key, args);
      ...
      if ( raw )            { return out; }
      else if (escapehtml)  { return escapeHtml(out); }   // <- the default
    }
    vueApp.config.globalProperties.t = function(key, args, raw) {
      return stringFor(this.$store, key, args, raw);
    };
    ```

    That is correct for the `v-t` directive it was written for, which assigns to `innerHTML` — the browser decodes the entities on the way in. It is **wrong for a mustache**, which sets *text*: nothing decodes, and the user reads `shell&#39;s own screens` on the page. Same for `:title="t(...)"` and any other attribute binding.

    `escapeHtml` touches five characters — `&`, `<`, `>`, `"`, `'` (`@rancher/shell/utils/string.js`). **An apostrophe in an English sentence is the one that bites**, because it is easy to write, common in good prose, and invisible to both `tsc` and ESLint — the damage only shows at runtime.

    The store getter underneath (`i18n/t`) interpolates without escaping, so the fix is a local `t` that shadows shell's global. Put it in `utils/i18n.ts` and use it in every component you write:

    ```ts
    import { defineComponent } from 'vue';
    import { useStore } from 'vuex';

    export type Translate = (key: string, args?: Record<string, unknown>) => string;

    /** For `<script setup>` components. */
    export function useTranslation(): Translate {
      const store = useStore();

      return (key, args) => store.getters['i18n/t'](key, args);
    }

    /** For Options API components — `methods.t` wins over `globalProperties.t`. */
    export const i18nMixin = defineComponent({
      methods: {
        t(key: string, args?: Record<string, unknown>): string {
          return this.$store.getters['i18n/t'](key, args);
        },
      },
    });
    ```

    ```vue
    <script setup lang="ts">
    import { useTranslation } from '../utils/i18n';

    const t = useTranslation();
    </script>
    ```

    Because both are named `t` at the call site, every existing `{{ t('some.key') }}` keeps working unchanged.

    **Notes:**
    - `t(key, args, true)` against shell's global works too, but it has to be remembered at a few hundred call sites and forgetting it fails silently. Shadow once per component instead
    - **`labelKey` / `tooltipKey` props are unaffected** — shell renders those through `v-clean-html`, which decodes entities correctly. This is one more reason to prefer them over `label`/`tooltip`
    - Passing a non-escaped string into a shell prop that ends up in `innerHTML` is safe for ordinary prose, but do not put raw HTML in translation values to be rendered that way — use `RichTranslation` with slots
    - Don't try to work around it by avoiding apostrophes. "Do not" everywhere reads like a terms-of-service document

    **Anti-pattern:** diagnosing this as a *file-encoding* problem. The YAML is UTF-8, `js-yaml-loader` does not touch it, and the built chunk carries the correct bytes — check the rendered DOM for `&#39;` / `&amp;` / `&quot;` before going anywhere near charset headers. Note also that `escapeHtml` does **not** touch `—`, `–` or `…`; if those look wrong, it is a different problem. Shell's own `en-us.yaml` still prefers ASCII (`...` 31 times against `…` 3), so plain ASCII punctuation is the safer default either way.

11. **Avoid direct DOM manipulation.** Always use Vue's reactive system and template syntax to update the UI. Directly manipulating the DOM can lead to unpredictable behavior and break reactivity.

12. **Follow accessibility best practices.** Ensure that all interactive elements are keyboard navigable, provide appropriate ARIA attributes, and maintain sufficient color contrast to support users with disabilities.

13. **Write unit tests for critical logic.** Ensure that any complex business logic, especially around state management and API interactions, is covered by unit tests to prevent regressions and facilitate future refactoring.

14. **Respect design guidelines.** Follow the established design patterns and guidelines for the Rancher UI to ensure a consistent and intuitive user experience. Be mindful of spacing (margins/paddings), typography, and component usage to maintain visual harmony. `rancher-ui-styling.md` carries the actual values: the spacing scales and helper classes, the `--gap*` tokens, the type scale, and the spacing shell itself uses per context. Two things to get right by default — the page gutter is already applied by `.outlet` (24px, don't add your own), and `RcSection`/`RcContentGroup` space form content for you (16px / 24px) so you shouldn't be writing margins between inputs.

---

## Scope the request first

This skill covers everything from "scaffold me an extension" to "make this column
sortable". Those need very different amounts of process. Classify the request, then
run only the phases that track lists. **Over-processing a small change is a failure
mode, not caution** — nobody wants a discovery interview to add a table column.

| Track | Looks like | Run | Approval gate |
|---|---|---|---|
| **A — New extension** | "build me an extension that…", "scaffold…"; no `pkg/<name>/index.ts` exists yet | Phases 1 → 8 in full | Yes, after Phase 4 |
| **B — New feature** | "add a page/list/detail/tab/panel/card/action for…", "support resource X", "add a settings page" | 1 (short) → 2 (targeted) → 4 (short) → 6 → 7 → 8 (short) | Yes — a one-paragraph plan, one confirmation |
| **C — Change** | "refactor page Z", "restyle…", "fix…", "add a column", "why does this render wrong" | 2 (only the reference file that applies) → 6 → 7 | No |
| **D — Question / review** | "how do I…", "is X supported in 2.x", "review this component" | Answer from the documentation map and local reference files | No |

**Every track, always:** the non-negotiable rules above. **Every track that writes
code, including C:** the Phase 7 quality gate — a two-line change still has to lint
and build.

**State the track in your first reply** and keep it to one line, e.g. *"Treating this
as a Track C change — going straight to the edit, then lint + build-pkg."* When in
doubt pick the lighter track; if it turns out bigger than it looked, escalate and say
why. Don't silently run a heavier track than the user asked for.

---

## Phase 1: Discovery

**Run when:** Track A in full. Track B as a single paragraph confirming what you
understood and which resource/screen it touches. Skip entirely for C and D.

**Goal**: Understand what to build before touching the docs or code.

Request (empty if the skill self-triggered — use the conversation instead): $ARGUMENTS

**Actions**:
1. Create a todo list covering the phases your track runs.
2. If the request is vague, ask the user for:
   - What problem does this extension solve?
   - Which Rancher resources or APIs does it interact with?
   - Is there an existing Helm chart/operator that needs to be installed first?
   - Which Rancher cluster context (local, downstream, both)?
   - Any specific screens, views, or navigation entries expected?
3. Confirm understanding with a short summary before proceeding.

---

## Phase 2: Read Required Docs

**Goal**: Load only the docs needed for this specific extension — do not batch-read everything.

**Actions**:
1. Read `rancher-ui-components.md` and `rancher-ui-patterns.md` — do this first, before fetching any URLs. They cover the full component library and standard composition patterns. Read `rancher-ui-styling.md` too if you will be writing any CSS of your own (custom components, dashboard layouts, anything with its own `<style>` block). If the extension has an overview/dashboard page, or shows vulnerability, scan or health summaries, pay particular attention to "Security & Dashboard Primitives" in `rancher-ui-components.md` and the overview/security dashboard patterns in `rancher-ui-patterns.md`.
2. Always fetch the **Product Registration API** page and the **support matrix**. If the target Rancher is below 2.15, fetch the legacy products page instead (rule #1).
3. Based on the feature set, selectively read:
   - Resources API if the extension manages custom Kubernetes resources
   - Shell API interfaces (SlideIn, Modal, Notification) if the UX requires panels or dialogs
   - Extensions API pages (Actions, Cards, Panels, Tabs, Table Columns) for any augmentation of existing Rancher views
4. Scan the most relevant reference implementation for patterns (especially routing, component usage, and permission guards). Prefer reading a specific file over the entire repo.
5. Note any operator or chart dependency from the reference implementations. 

---

## Phase 3: Clarifying Questions

**Run when:** Track A only. On Track B, ask only what you genuinely cannot answer by
reading the repo — existing extensions already settle most of these (nav structure,
permissions, scope). On C and D, don't ask; just do the work.

**Goal**: Surface all gaps before architecture or scaffolding.

**Actions**:
1. Present a numbered list of any open questions to the user, covering:
   - Feature scope and edge cases
   - Whether any operator/chart dependency exists
   - Permission requirements per screen
   - Navigation structure (top-level product, sub-nav, cluster nav, or augmented view)
   - Expected empty/error states
2. Wait for user answers before continuing.  

If the user says "use your best judgement", provide a clear recommendation per item and ask for a single confirmation.

---

## Phase 4: Architecture Design

**Run when:** Track A — full written plan, wait for approval. Track B — a short plan
(files you'll add, shell components you'll use, where it hooks into nav) and one
confirmation, not a numbered interrogation. Skip for C and D.

**Goal**: Design the extension structure before writing code.

**Actions**:
1. Propose the extension layout:
   - Product registration: routes, navigation entries, cluster/local scope
   - Settings page, if needed for overall setup and configuration
   - Views (list views, detail views, custom pages)
   - Shell API usage (modals, slide-ins, notifications) — see the Shell API pages in the documentation map
   - Which extension points you'll use (`addPanel`/`addTab`/`addAction`/`addCard`/`addTableColumn`) — consult [`api/overview`](https://extensions.rancher.io/extensions/next/api/overview) for the full list and [`api/common`](https://extensions.rancher.io/extensions/next/api/common) for how each is scoped
   - Whether you need a custom store ([`advanced/stores`](https://extensions.rancher.io/extensions/next/advanced/stores)) or nav hooks ([`advanced/hooks`](https://extensions.rancher.io/extensions/next/advanced/hooks))
   - Custom components (only where shell/rancher components fall short)
   - Resource types and their API groups/versions
2. Flag any required operator/chart dependency and where the guard screen will be placed.
3. Call out any permission-scoped screens.
4. Present the plan to the user and wait for approval before proceeding.

5. Make sure that you propose the headers for each table/list view based on the important fields of the underlying resource for the context of the user/app.

6. Make sure that you check the need for a "settings" page and any overall configuration requirements. Keys and tokens needed for the app to run may live in secrets in a secure manner. Don't hard-code or leave sensitive information in the repository unprotected.

7. Make sure that if any CRD or K8S instances are needed for the extension to setup and run properly, they can be created from the UI to facilitate setup (no duplicate creation attempts).

8. Operator dependency guard pattern: 
Check if the required CRD or deployment exists before rendering the main view. If absent, render an empty-state component with an install action pointing to the Apps & Marketplace catalog.

9. Permission check pattern: - No docs page covers this — the snippet below is from shell source (`shell/plugins/dashboard-store/getters.js`, `shell/types/store/type-map.ts`). Verify against source if it misbehaves, and consider filing a docs request.
There is no global `canAccess` getter. Permissions come from the schema Rancher returned for the current user — if a user can't see a type, its schema is simply absent.

```ts
const canList = store.getters['cluster/canList'](MY_TYPES.POLICY);
const schema  = store.getters['cluster/schemaFor'](MY_TYPES.POLICY);
const canCreate = !!schema?.collectionMethods?.find((m) => m.toLowerCase() === 'post');
```

Gate at three levels:

**Nav** — `enable: { ifHaveType, ifHaveVerb }` on the page config, so the entry never appears.

**Page** — if `!schema`, render an "insufficient permissions" empty state, not an empty table.

**Action** — gate each `_availableActions` entry on the relevant verb.

Always test with Standard User and User-Base accounts, not just admin.


---

## Phase 5: Scaffolding

**Run when:** Track A only, and only if the repo doesn't exist yet.

**Goal**: Set up the extension project structure correctly.

**Actions**:
1. Follow the Getting Started guide for the correct scaffold command: https://extensions.rancher.io/extensions/next/extensions-getting-started
2. Verify the generated `package.json` references `@rancher/shell` (not an old shell version).
3. Wire up `pkg/<name>/index.ts` per the Product Registration docs: `importTypes(extension)`, `extension.metadata = metadata` (with `import metadata from './package.json'`), then `addProduct`/`extendProduct`.
4. Install dependencies and confirm the dev server starts without errors.

---

## Folder layout, models & model extensions

Read [`folder-structure`](https://extensions.rancher.io/extensions/next/folder-structure) before creating any file — it documents every auto-imported folder (`chart`, `cloud-credential`, `content`, `detail`, `edit`, `list`, `machine-config`, `models`, `promptRemove`, `l10n`, `windowComponents`, `dialog`, `formatters`) and what each is for. Mechanism: [`api/components/auto-import`](https://extensions.rancher.io/extensions/next/api/components/auto-import). Model extensions for built-in Rancher types: [`provisioning/overview#models`](https://extensions.rancher.io/extensions/next/provisioning/overview#models).

Three things that fail **silently** and aren't flagged as hazards in the docs:

1. **Wrong folder or filename = no error.** Filenames in `models/`, `detail/`, `edit/`, `list/`, `promptRemove/` must be the exact resource type (`loadbalancer.harvesterhci.io.ippool.js`). A mismatch just renders the default screen. If a custom view "isn't picking up", check the filename before debugging the component.
2. **`importTypes(extension)` is required.** Without it, none of the above folders are scanned at all.
3. **Models and l10n keys are global.** A file in `models/` overrides `shell/models/` **app-wide**, and duplicate translation keys overwrite shell strings **app-wide**. Scope model overrides by nesting under a subfolder named after the store namespace, and prefix every translation key with your product name.

`addModelExtension` is `@experimental` and currently only `provisioning.cattle.io.cluster` consults a registered extension — check the docs before assuming it works for your type.

### Extension configuration

Version gating, display name and icon live in `pkg/<name>/package.json` under `rancher.annotations`. Full reference, including which Rancher version introduced each annotation: [`configuration`](https://extensions.rancher.io/extensions/next/configuration). See also [`advanced/version-compatibility`](https://extensions.rancher.io/extensions/next/advanced/version-compatibility).

Two things worth knowing up front:
- **`catalog.cattle.io/ui-extensions-version` is mandatory from Rancher 2.10** — without it the extension is not loaded at all. Pin the major you built against.
- Bump `catalog.cattle.io/rancher-version` to `>= 2.15.0-0` if you use the Product Registration API (rule #1).

Some annotations used by shipped extensions aren't in the docs table (`prime-only`, `certified`, `experimental`) — grep the official repos if you need one. For Prime-gated features also guard at runtime: `if (!extension.environment.isPrime) { return; }`

---

## Phase 6: Implementation

**Run when:** every track that writes code.

**Goal**: Build the extension feature by feature, screen by screen.

**Track A and B: do not start without the Phase 4 approval.** Track C needs no
approval — the user already told you what to change.

**Actions**:
1. Implement each screen in the order agreed in Phase 4.
2. For every UI element, follow the component priority (browse https://rancher.github.io/storybook/ first; consult `rancher-ui-components.md` for props and anti-patterns):
   - First: `@shell/components/...`
   - Second: `@components/...` (the `@rancher/components` library — the import alias is `@components`)
   - Last resort: custom component (document why shell/rancher components were insufficient)
   When composing screens, use `rancher-ui-patterns.md` as a starting template (list pages, edit forms, detail views, dialogs, form layouts, overview and security dashboards, etc), and `rancher-ui-components.md` for the individual building blocks, including the severity/status primitives. Any value you are about to hard-code in a `<style>` block — a colour, a margin, a radius, a z-index — should come from `rancher-ui-styling.md` instead.
3. For screens requiring an operator, implement the guard first — render operator install prompt before any resource-dependent content.
4. For each screen with cluster-scoped resources, add a permission check and graceful fallback UI.
5. Keep TypeScript strict — avoid `any`, use proper types from `@rancher/shell` where available.
6. After each screen, run:
   ```bash
   yarn lint
   ```
   Fix all lint errors before continuing.
7. Update todos as each screen is completed.
8. **Proxying API calls through the Rancher backend.** Never add a `server.proxy` block to the extension's `vite.config.mjs`: that only works in dev mode and disappears once the extension is built. Use one of the two mechanisms that work identically in dev and in a built/installed extension:

   **a) External / third-party APIs → `/meta/proxy` via the shell Proxy API.** Use `this.$shell.proxy` (Options API) or `useShell().proxy` from `@shell/apis` (Composition API). It builds the `/meta/proxy/<host>/<path>` URL and auth headers for you, and avoids browser CORS limits.

   ```ts
   import { useShell } from '@shell/apis';

   const shell = useShell();
   const CR_NAME = 'my-extension-endpoints';

   // 1. Ensure the target host is on Rancher's proxy allow-list (else requests 503)
   if (!await shell.proxy.hasProxyEndpoint(CR_NAME)) {
     await shell.proxy.allowDomains(['api.example.com'], CR_NAME);
   }

   // 2. Make the request
   const data = await shell.proxy.request({
     url:            new URL('https://api.example.com/v1/things'),
     authentication: { token: myApiToken }, // or { id: cloudCredentialId, authSigner: 'bearer', passwordField: 'token' }
   });
   ```

   Notes:
   - Allow-listing uses the cluster-scoped `ProxyEndpoint` CR (`management.cattle.io/v3`). Prefer `hasProxyEndpoint(name)` over `isDomainAllowed(domain)` — the latter fetches *all* `ProxyEndpoint` CRs. Wildcards are supported (`*.example.com`, `%.example.com`); overly broad patterns like `*.com` are rejected by the backend webhook.
   - For credentials, prefer the Cloud Credential form (`{ id, authSigner, passwordField, usernameField }`) — Rancher signs the upstream request server-side and the secret never reaches the browser.
   - Use `createDepaginator()` from `@shell/apis/shell/proxy` for paginated list endpoints.
   - Requires `@rancher/shell` >= 3.0.12 and Rancher 2.14+ (for the `ProxyEndpoint` CRD). On older Rancher, domains are allow-listed through the `whitelist-domain` setting instead.
   - Full reference: https://extensions.rancher.io/extensions/next/provisioning/node-driver/proxying

   **b) Services running inside a managed cluster → the Kubernetes API service proxy.** No allow-list needed, just RBAC on the service:

   ```
   /k8s/clusters/<clusterId>/api/v1/namespaces/<ns>/services/<scheme>:<serviceName>:<port>/proxy/<path>
   ```

   This is the pattern shell itself uses for Grafana and Alertmanager (see `shell/utils/grafana.js`). Dispatch it with `store.dispatch('cluster/request', { url })`.

   Both work in dev because the dashboard dev server already proxies `/meta` and `/k8s` to the Rancher API (`shell/vite.config.mjs`), which is precisely why your own proxy block isn't needed.

---

## Phase 7: Quality Gate

**Run when:** always, on any track that touched code. No exceptions for "small"
changes — rule #8 has no size threshold.

**Goal**: The extension must pass all three checks before being considered complete.

**Actions**:
The scaffold (`@rancher/create-extension`) generates exactly these scripts: `dev`, `build`, `lint`, `clean`, `build-pkg`, `serve-pkgs`, `publish-pkgs`, `parse-tag-name`. There is **no `tsc` script and no `test` script** — check `package.json` rather than inventing command names.

1. **Lint**: `yarn lint`. Fix every error; most extensions run `--max-warnings 0`. Config and rules: [`linting`](https://extensions.rancher.io/extensions/next/linting).
2. **Type check**: enforced via `@vue/cli-plugin-typescript` during the build, so step 3 is the real gate. To check types alone: `npx vue-tsc --noEmit -p pkg/<name>/tsconfig.json`.
3. **Build**: `yarn build-pkg <pkg-name>` — `<pkg-name>` is the directory under `pkg/`, not the repo name. Must finish with no errors.
4. **Tests**, if present: `yarn test:ci`.

If any check fails, fix the issue and re-run that check before moving to the next one.

If the extension doesn't load after install, work through [`troubleshooting`](https://extensions.rancher.io/extensions/next/troubleshooting) before guessing.

---

## Testing

The scaffold ships **no test setup** — no `test` script, no Jest config. Add it following [`unit-testing`](https://extensions.rancher.io/extensions/next/unit-testing), which has the full `jest.config.js`, the SVG transform, and a CI workflow. Working reference: https://github.com/rancher/ui-plugin-examples/tree/main/pkg/unit-testing-example

Test models and pure helpers first — `applyDefaults`, `customValidationRules`, `_availableActions`, display getters need no Vuex mocking and catch the most regressions.

Any test file must have zero lint and zero TypeScript errors before it is presented.

---

## Phase 8: Summary

**Run when:** Track A uses the full template below. Track B uses "What was built" and
"Files modified" only. Track C gets one or two sentences — what changed, and that lint
and build passed. Track D needs none.

**Goal**: Give the user a clear picture of what was built and how it advances SUSE's product portfolio.

**Template to follow**:

### What was built
Describe each screen/view/feature implemented, what the user can do with it, and how it integrates with Rancher.

### How to use it
Step-by-step: install the extension, navigate to the relevant area, perform the key actions.

### Operator/chart dependencies
List any required Helm charts and point to where the install prompt appears in the UI.

### Files modified
List the key files created or modified.

### Suggested next steps
Any follow-up features, accessibility improvements, or areas for testing.

---

## Common pitfalls

| Pitfall | What to do instead |
|---|---|
| Hand-writing routes and DSL by default | Use the Product Registration API; the DSL is a pre-2.15 fallback (rule #1) |
| Copying product registration out of kubewarden/harvester | They predate the API — copy their models and components, not their `config/` folder |
| Using an API hook the target Rancher version doesn't have | Check the [support matrix](https://extensions.rancher.io/extensions/next/support-matrix) first |
| Building a custom banner/modal/slide-in from scratch | Check `@shell/components` for `Banner`, `Modal`, and slide-in patterns |
| Rendering resource lists without checking if the CRD exists | Add an operator guard screen first |
| Hard-coding cluster context | Respect `this.$store.getters['currentCluster']` and check downstream vs local |
| Ignoring standard users | Test with a non-admin Rancher account and guard appropriately |
| Detail page masthead as a wrapping row of muted "Label value" pairs, grey `BadgeState`s for on/off settings, then a bare `h2` | Title bar, then a 3-column `SpacedRow` of shell `Card`s (`IdentifyingInformation` facts, ✓/— policy checklist, `PercentageBar` usage), then a section header with a count. See **Detail Page Masthead** in `rancher-ui-patterns.md` |
| Overview page built as a grid of equal-height bordered cards (one tall list stretches the row, tiny coloured numbers, wrapping CVE IDs) | Summary strip, distribution bars and fixed-column top-N lists from `rancher-ui-patterns.md` and `rancher-ui-components.md`; long lists go in a table or tab |
