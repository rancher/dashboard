# Contributors Guide

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

## Milestone guidance

- All changes must first be made in the `master` branch
- If backports are needed they can be made via the backport bot
  - github issue
    - `/backport <target milestone>` e.g `/backport v2.12.2`
  - pull requests
    - `/backport <target milestone> <target branch>` e.g. `/backport v2.12.2 release-12`
    - All backported pull requests must link to a backported issue

## Creating a commit

- Follow the [Chris Beams](http://chris.beams.io/posts/git-commit/) 'seven rules of a great Git commit message'  for commit messages.

## Creating a Pull Request

- Pull requests must come from forks
- Description should always reference the issue that the PR resolves e.g. `Fixes #1234`.
- Pull Requests that update code in `shell/` should update existing or add new unit tests to cover the change in functionality
- A Pull Request will only be merged once
  - The pull request checklist has been completed
  - ALL CI gates have passed
  - At least one rancher/dashboard team member reviews and approves the PR

TODO: RC should we move contributors content to the internal storybook and pull it in?