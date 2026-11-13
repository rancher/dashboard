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

## Translations

- Translations live in `shell/assets/translations/`. `en-us.yaml` is the source of truth.
- A link in another locale must use the same URL, anchor and attributes (e.g. `target="_blank" rel="noopener nofollow"`) as `en-us.yaml`.
- When adding or changing a docs link, check that the page and its `#anchor` exist on the current docs site. The Rancher docs are built with Antora, so section anchors look like `#_section_title`, not `#section-title`.
- If a docs link changes, update any e2e test that asserts the URL (search `cypress/` for the old anchor).

