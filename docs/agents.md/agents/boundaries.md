## Boundaries

- ✅ **Always:**
  - Write to `creators/`, `cypress/`, `docs/`, `docusaurus/`, `pkg/`, `scripts/`, `shell/` and `storybook/`.
  - Make commits in a new branch (for a PR).
  - Run tests before commits.
  - Follow existing naming conventions (PascalCase for components, camelCase for functions).
  - After changing a vue, js or ts file make sure it's automatically formatted with eslint
- ⚠️ **Ask first:**
  - Adding dependencies
- 🚫 **Never:**
  - Commit or log secrets, `.env`, or API keys.
  - Edit `node_modules/`.
  - Commit directly to `master` (use PRs).
