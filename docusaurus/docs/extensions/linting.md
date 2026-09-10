# Linting (ESLint)

`@rancher/shell` provides the ESLint toolchain that extensions use. As of Shell v3.1, that toolchain moved from ESLint 7 (legacy `.eslintrc.*` config) to **ESLint 10 with flat config** (`eslint.config.mjs`).

ESLint 10 cannot read a legacy `.eslintrc.*` file at all, so this would normally be a breaking change for every published extension. To avoid that, `@rancher/shell` ships **both** ESLint toolchains and selects the right one for your project automatically.

## How selection works

Run linting through the launcher that `@rancher/shell` provides, wired up as the `lint` script:

```json
{
  "scripts": {
    "lint": "./node_modules/@rancher/shell/scripts/lint --ext .js,.ts,.vue ."
  }
}
```

The launcher looks at which config file exists in your extension and picks the matching ESLint:

| Config file in your extension | ESLint used |
|---|---|
| `eslint.config.{js,mjs,cjs}` (flat) | ESLint 10 |
| `.eslintrc.{js,cjs,json,yml,yaml}` (legacy) | ESLint 7 |

So an extension that still uses a legacy `.eslintrc.*` keeps linting on ESLint 7 with no changes, and an extension that has migrated to a flat `eslint.config.mjs` is linted with ESLint 10. The ESLint 7 toolchain is self-contained and installed on first use (it needs network access and a writable `node_modules` the first time you lint a legacy project).

## New extensions

Extensions scaffolded with the creator already include:

- an `eslint.config.mjs` that re-exports the shared Rancher config, and
- the `lint` script shown above.

The generated `eslint.config.mjs` is only a few lines — the ruleset lives in `@rancher/shell`:

```js
import shellConfig from '@rancher/shell/eslint.config.base.mjs';

export default [
  ...shellConfig,

  // Add project-specific overrides below.
];
```

## Existing extensions

You do **not** have to change anything to keep `yarn lint` / CI working — the launcher keeps your legacy `.eslintrc.*` on ESLint 7. Make sure your `lint` script points at the launcher (as above) so the selection happens.

### Extra ESLint plugins

The ESLint 7 toolchain ships a fixed set of plugins (Vue, TypeScript-ESLint, standard, import, node, promise, Cypress). If your `.eslintrc.*` references a plugin outside that set — for example `eslint-plugin-jest` — declare it in your `package.json` so the launcher installs it **into** the isolated toolchain, where it resolves against ESLint 7 (rather than the flat-config ESLint 10 hoisted in your project, which the legacy plugin cannot run against):

```json
"@rancher/shell": {
  "eslintLegacyPackages": {
    "eslint-plugin-jest": "^24"
  }
}
```

Pin a version compatible with ESLint 7 (e.g. `eslint-plugin-jest@^24` rather than the newer releases built for ESLint 8+). The launcher installs these the first time you lint and skips them once present.

When you are ready to move to ESLint 10 / flat config:

1. Delete `.eslintrc.*` and `.eslintignore`.
2. Add an `eslint.config.mjs` that re-exports the shared config (see above), moving any custom rules into the exported array.

This is the same setup new extensions are scaffolded with, so you can copy the generated `eslint.config.mjs` as a starting point.

## Editor (IDE) integration

The launcher only governs command-line and CI linting. Editor ESLint integrations (VS Code, JetBrains) load the `eslint` module directly and do not go through the launcher, so an editor resolves a single ESLint version.

- **Flat-config extensions** work out of the box (the resolved ESLint is 10).
- **Legacy-config extensions** that want in-editor linting can point the editor at the shipped ESLint 7 toolchain, e.g. in `.vscode/settings.json`:

  ```json
  {
    "eslint.nodePath": "node_modules/@rancher/shell/eslint-legacy/node_modules"
  }
  ```

  (Run `yarn lint` once first so the legacy toolchain is installed.) Migrating to flat config removes the need for any editor-specific setting.
