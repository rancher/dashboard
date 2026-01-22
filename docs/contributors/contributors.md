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

## Milestone guidance

- All issues must first be resolved in the `master` branch
- If backports are needed they can be made via the backport bot
  - github issue
    - `/backport <target milestone>` e.g `/backport v2.12.2`
  - pull requests
    - `/backport <target milestone> <target branch>` e.g. `/backport v2.12.2 release-12`
    - All backported pull requests must link to a backported issue


## Creating a branch

### To resolve an issue
- Checkout the branch matching the milestone of the issue `git checkout ${targetMilestoneBranch}`. Replace `${targetMilestoneBranch}` with the target milestone of the issue. For example
  - `master` for the latest unreleased minor version
  - `release-X` for release minor versions
    - `release-2.14`
    - `release-2.13`
    - `release-2.12`
- Ensure you have the latest of that branch `git pull --rebase`
- Checkout the branch to commit the changes to `git checkout issue-${issueNumber}`. Replace `${issueNumber}` with the issue number.

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

## Testing

### Unit Tests

Please see [Rancher UI Internal Documentation - Testing - Unit Tests](https://extensions.rancher.io/internal/testing/unit-test) for more information

- To run a single test file: yarn test `<full-path-to-test-file>`

### E2E Tests (Cypress)

- Interactive mode: `yarn cy:e2e`
- Headless mode: `yarn cy:run`
- Run a specific spec file: `yarn cy:run --spec cypress/e2e/tests/<path-to-spec>.spec.ts`

#### Required Environment Variables

- `TEST_PASSWORD` - Password for login (or CATTLE_BOOTSTRAP_PASSWORD for setup tests)
- `TEST_BASE_URL` - Dashboard URL (defaults to https://localhost:8005)
- `TEST_USERNAME` - Username (defaults to admin)

#### Optional Environment Variables

- `TEST_SKIP` - Comma-separated test directories to skip (e.g., setup,extensions)
- `TEST_ONLY` - Comma-separated test directories to run exclusively
- `GREP_TAGS` - Filter tests by tags
