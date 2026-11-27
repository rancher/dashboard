## Getting Started

Please see the [Rancher UI Internal Documentation](https://extensions.rancher.io/internal/docs).

To get started, follow the `Getting Started` section.

## Project Information

- **Tech Stack:**
  - `Vue.js`: Framework
  - `Linting`: ESLint
  - `CSS`: SCSS should be used
  - `TypeScript`: Primary language for logic.
- **Code Style and Standards:**
  - `Language`: TypeScript is preferred for new code.
  - `Vue.js`:
    - Composition API components are preferred over Options API.
    - Large pages with lots of code and styles should be avoided by breaking the page up into smaller Vue components.
    - Place source tag above template above style.
    - style tag should contain `lang='scss' scoped`.
  - `Linting`: Follow the ESLint configuration in the root.
  - `CSS`:
    - SCSS variables are in `shell/assets/styles/`.
- **File Structure:**
  - `creators/`: Tools for scaffolding new extensions.
  - `cypress/`: Cypress E2E test specifications.
  - `docs/`: Internal documentation source.
  - `docusaurus/`: Public documentation source.
  - `pkg/`: Internal Rancher UI extensions.
  - `scripts/`: Bash scripts used in build, test and github workflows
  - `shell/`: Core application logic, components, and pages.
  - `storybook/`: Component documentation source

When either created, editing, viewing or listing a kubernetes resource the following core components are used
- Listing resources
  - Root component
    - shell/pages/c/_cluster/_product/_resource/index.vue
  - shell/components/ResourceList/index.vue
    - This contains a generic component for the list's header
    - Then either a ResourceTable or a custom page for that specific resource type
      - custom components are either supplied via components in `shell/list` or externally via a UI Extension
- Create / Edit a resource, or Viewing a Resource
  - Root component
    - Create / Edit - shell/pages/c/_cluster/_product/_resource/create.vue
    - Viewing - shell/pages/c/_cluster/_product/_resource/_id.vue
  - shell/components/ResourceDetail/index.vue
    - Contains either
      - a totally custom page for that resource type and mode,
      - or a generic component for header, handling YAML or a custom component to show a form
    - custom components are either supplied via components in `shell/edit` (create/edit), `shell/detail` (detail) or externally via a UI Extension

## Fetching Resources

- Prefer the store's `findX` actions (`find`, `findAll`, `findPage`, etc) over dispatching `<store>/request`.
  - `findPage` can be used for any request that needs to use pagination args (page size, filters, sort). It's not just for requests to support lists.
  - By default `findX` actions cache the result and watch for changes (cache automatically updates).
    - A resource type only has one cache. Most calls replace its content.
      - This can cause concurrency issues: for example a list of pods gets its rows from `findPage`. If another component then calls `findAll` for pods, the pod cache containing a page is replaced with every pod and the list stops showing its page.
      - To avoid the cache
        - for `find` or `findPage` provide `transient: true`.
        - for other requests fall back to `<store>/request`.
        - in all cases the results aren't watched and won't update automatically.
    - A watch will ensure the cache is kept up to date with server-side changes (new, updated or deleted resources).
      - Sometimes this isn't needed, so provide `watch: false`.
- If a `<store>/request` action is used to fetch a kubernetes resource
  - the url can be calculated via the `<store>/urlFor` getter.
  - results are JSON and not instances of the Resource model. They can be manually converted via the `<store>/create` action (or `<store>/createMany` for an array).
- Avoid fetching all of a resource type that can scale to large numbers, especially clusters (`MANAGEMENT.CLUSTER`). Instead
  - for a dropdown, use `ResourceLabeledSelect` (`shell/components/form/ResourceLabeledSelect.vue`). With pagination enabled it requests one page at a time and doesn't persist results to the store. See `shell/components/form/SecretSelector.vue`, which filters secrets server-side by name, namespace and type via `paginatePageOptions`
  - if only the spread of possible options for a property in a resource is needed use the steve store's `fetchResourceSummary` action (e.g. `summaryField: 'metadata.name'`)

## Translations, Internationalization and Localization

- Shell translations live in `shell/assets/translations/`. `en-us.yaml` is the source of truth.
- Built-in packages in `pkg/` (e.g. `aks`, `eks`, `gke`) have their own `l10n/` translation files. Strings used only by a package go in that package's files.
- A link in another locale must use the same URL, anchor and attributes (e.g. `target="_blank" rel="noopener nofollow"`) as `en-us.yaml`.
- When adding or changing a docs link, check that the page and its `#anchor` exist on the current docs site. The Rancher docs are built with Antora, so section anchors look like `#_section_title`, not `#section-title`.
- If a docs link changes, update any e2e test that asserts the URL (search `cypress/` for the old anchor).

## Code
- JS/Typescript
  - Avoid top-level `functions` in files that support inline methods
    - Good - JS/Typescript classes can have `private` methods
    - Good - Vue Options API components can use `methods`
  - Avoid small (< 5 lines) `functions` that are only called once
    - Good - include the logic inline in the calling function
    - Bad - a single use 3 line `function` called from a simple calling function
    - Exception - extracting is fine if it needs its own unit test, a name makes complex logic clearer, or the calling function is already complex
  - Avoid using Typescript `as` notation if there is a suitable alternative
    - Bad - `const a = { .. } as MyInterface`
    - Good - `const a: MyInterface = { .. }`
  - Avoid creating new Typescript Interfaces and Types if they exist already in `shell/types`
