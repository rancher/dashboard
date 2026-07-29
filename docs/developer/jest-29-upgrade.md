# Jest 27 → 29 upgrade

This documents the upgrade of the unit-test toolchain from **Jest 27.5.1 to Jest 29.7.0**.

## Why Jest 29 and not Jest 30

Jest **30 is not currently possible**: the Vue single-file-component transformer **`@vue/vue3-jest`** tops out at **`29.2.6`**, with a hard peer dependency of `jest: 29.x` (and `babel-jest: 29.x`). There is no `@vue/vue3-jest` release that supports Jest 30, and it is required to compile `.vue` component tests. So the ceiling is Jest 29 until `@vue/vue3-jest` ships a v30-compatible release.

## Version bumps

Jest runs only from the **repo root** (`jest.config.js`) over `shell/`'s tests; `shell`'s own `test` script uses AVA, not Jest. Jest packages are bumped in two places — root `package.json` (devDependencies, used to run the suite) and `shell/package.json` (dependencies, which hoist transitively into extensions).

| Package | From | To | Where |
|---|---|---|---|
| `jest` | 27.5.1 | **29.7.0** | root + shell |
| `babel-jest` | 27.5.1 | **29.7.0** | root |
| `ts-jest` | 27.1.5 | **29.4.12** | root |
| `@vue/vue3-jest` | 27.0.0 | **29.2.6** | root + shell |
| `jest-environment-jsdom` | *(none)* | **29.7.0** | root + shell (**new**) |

`jest-environment-jsdom` is a **new dependency**: Jest 28+ removed jsdom from Jest core, so the `testEnvironment: 'jsdom'` used by this repo now requires the separate package. It is added to `shell/package.json` too, so extensions that rely on the shell's transitive Jest keep a working jsdom environment.

Left unchanged (no need): `@types/jest 29.5.12` (already ahead), `jest-junit 16.0.0`, `jest-serializer-vue 2.0.2`, `eslint-plugin-jest 29.15.2`, `flush-promises 1.0.2`.

## `jest.config.js` changes

Three changes were required (all resolution/environment config — **not** rule or behaviour changes):

1. **`testEnvironmentOptions: { customExportConditions: ['node', 'node-addons'] }`**
   Jest 28+ (`jest-environment-jsdom`) defaults package resolution to the `browser` export condition. That makes packages like **`@vue/test-utils`** resolve their *browser* build (which expects a global `Vue`) and throw `ReferenceError: Vue is not defined` in `jest.setup.js`. Pinning the conditions to node restores the Jest 27 behaviour.

2. **`moduleNameMapper`: `^clipboard-polyfill$` → its concrete ESM build**
   Jest 28+ respects package `exports` maps (Jest 27 did not). `clipboard-polyfill`'s `.` export only declares an `import` (ESM) condition — no `require`/`default` — so a CJS `require('clipboard-polyfill')` (after Babel transforms `shell/utils/clipboard.js`) can no longer be resolved. Mapping it to `node_modules/clipboard-polyfill/dist/es6/clipboard-polyfill.es6.js` restores the Jest 27 `main`-based resolution.

3. **`transformIgnorePatterns`: added `clipboard-polyfill` to the allow-list**
   The file mapped in (2) is ESM, so it must be transformed by `babel-jest` — it is added to the `(?!(…)/)` allow-list alongside `color`, `vee-validate`, etc.

No other `jest.config.js` changes were made. Notably:
- The legacy `globals: { 'ts-jest': { isolatedModules: true } }` form is **kept** — ts-jest 29 still honours it (it emits a benign one-line deprecation warning). Migrating it to the `transform`-options form is a real change to the transform pipeline and was deliberately left out of scope.
- No `snapshotFormat` override was needed — all snapshots are `jest-serializer-vue` HTML and are unaffected by Jest 29's snapshot-format default change.

## Test-code changes

**None.** No `*.test.ts`/`*.spec.ts` files or snapshot (`.snap`) files were modified. All initial failures during the upgrade were config/resolution issues (fixed above) or an environment artifact (below), not test logic.

## Lockfiles

Both independently-tracked lockfiles were regenerated: root `yarn.lock` and `shell/yarn.lock`.

- Root: `yarn run install:no-lock`.
- Shell: `cd shell && yarn install` (the root `.yarnrc`'s `--frozen-lockfile true` is inherited into `shell/`, so it must be temporarily neutralised for the shell install).

**Gotcha — remove `shell/node_modules` after regenerating `shell/yarn.lock`.** Running `yarn install` inside `shell/` populates a *second* `node_modules` tree. Because the root jest run resolves modules from `shell/` upward, this creates a **duplicate copy of `vue`/`@vue/test-utils`** — `jest.setup.js` registers `config.global.mocks.t` on the root copy while components mount using the `shell/` copy, so the mock never applies and ~1000 tests fail with `_ctx.t is not a function`. Deleting `shell/node_modules` (it is gitignored and not needed for the root test run) resolves it. CI/normal flow does not create `shell/node_modules`, so this only affects local lockfile regeneration.

## Verification

- **Full suite green:** `yarn test:ci` → **541 suites passed, 7917 tests passed, 18 snapshots passed, 0 failures** (11 skipped / 16 todo as before). `jest.config.js` passes `yarn lint`.

## Extension impact

The shell ships Jest via `dependencies`, so it hoists transitively; it provides no shared Jest config or preset, and the extension scaffold sets up no Jest. Effects of this bump:

- **Extensions that pin their own Jest** (e.g. `rancher-ai-ui`, which declares `jest ^30`): **unaffected** — they use their own Jest, not the shell's. Verified: `rancher-ai-ui`'s suite is green (610 tests) against its published shell, using its own Jest 30. (Testing it against a raw local `file:` shell fails on unrelated shell-source resolution — a packaging/version artifact of a local shell, not this Jest change.)
- **Extensions that rely on the shell's transitive Jest** (no Jest of their own): they now resolve **Jest 29.7.0 + `jest-environment-jsdom` 29.7.0** — a working combination. Verified: `elemental-ui` installs cleanly against the upgraded shell.

There are no source-level shell changes in this upgrade (only `shell/package.json` dev/test deps + `shell/yarn.lock`), so extension **runtime** behaviour is unchanged.
