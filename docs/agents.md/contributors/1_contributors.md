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

