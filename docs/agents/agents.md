# AGENTS.md

## Project Overview

Rancher Dashboard is the user interface for Rancher, built using Vue.js and TypeScript. It interacts with the Rancher API to manage Kubernetes clusters.

## Personas

See [personas.md](./personas.md) for detailed agent personas.

## Tools

- **Install dependencies**: `yarn install`
- **Start development server**: `API=<Rancher_Backend_URL> yarn dev`
  - The `API` environment variable should point to a running Rancher server (e.g., `https://localhost`).
  - The dashboard will be available at `https://127.0.0.1:8005`.
- **Build**: `yarn build`
- **Lint**: `yarn lint`
- **Unit Tests**: `yarn test` (Jest)
- **E2E Tests**: Requires configuration

## Project knowledge

- **Tech Stack:**
  - `Vue.js`: Framework
  - `Linting`: ESLint
  - `CSS`: SCSS should be used
  - `TypeScript`: Primary language for logic.
- **Code Style and Standards:**
  - `Language`: TypeScript is preferred for new code.
  - `Vue.js`:
    - Composition API is preferred over Options API.
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

## Boundaries

- ✅ **Always:** 
  - Write to `creators/`, `cypress/`, `docs/`, `docusaurus/`, `pkg/`, `scripts/`, `shell/` and `storybook/`.
  - Run tests before commits.
  - Follow existing naming conventions (PascalCase for components, camelCase for functions).
- ⚠️ **Ask first:** Adding dependencies
- 🚫 **Never:** 
  - Commit secrets, `.env`, or API keys.
  - Edit `node_modules/`.
  - Commit directly to `master` (use PRs).

## Creating Commits and Pull Requests

- Follow the `docs/contributors/contributors.md` guide.


TODO: RC how much of this should be moved out to contributing.md (and referenced from here)
TODO: RC how much of this should be moved out to personas.md (and referenced from here)

TODO: RC does AI pick up 'follow x file' - gemini says no....
1. duplicate data between agent + contributors + personas
2. create a script that appends contributors + personas to agent

