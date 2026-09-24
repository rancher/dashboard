# Test Improver Memory

## Commands (Validated)

- **Install**: `yarn --ignore-engines install --frozen-lockfile`
- **Unit tests (single file)**: `node_modules/.bin/jest --no-coverage <path>`
- **Lint single file**: `node_modules/.bin/eslint --max-warnings 0 <file>`
- **Coverage**: add `--collectCoverage --coverageDirectory /tmp/coverage --collectCoverageFrom <file>` to jest invocation
- **Type-check (diff vs baseline)**: `node scripts/type-check-diff.mjs` — fails CI only on *new* type errors vs `scripts/type-check-baseline.txt` (baseline ~301-693 pre-existing errors, ratchets down over time; use this instead of `yarn type-check:ci` which fails on engine check)
- **Test framework**: Jest + TypeScript (ts-jest)
- **IMPORTANT**: `yarn test:ci` and `yarn type-check:ci` fail with engine check (Node 22 vs required >=24); use `node_modules/.bin/jest` and `node scripts/type-check-diff.mjs` directly

## ESLint Rules to Watch

- describe/it names must be lowercase (`jest/lowercase-name`)
- `toThrow()` requires message (`jest/require-to-throw-message`)
- Use `eslint --fix` for key-spacing, object-curly-newline
- `jest/require-top-level-describe` — hooks must be inside describe
- `jest/no-conditional-expect` — no `if` around `expect()`

## Testing Notes

- notifications actions: `bc` is module-level var; use `.call({ $extension: mock })` for handler tests
- notifications actions: BroadcastChannel must be mocked globally in `init` tests in `beforeEach`
- gc singletons: `jest.resetModules()` + `jest.mock('../gc')` in `beforeEach`
- window.js: mock `window.screen` via Object.defineProperty; use jest.useFakeTimers() for Popup
- computed.js: `integerString`/`keyValueStrings` return `{get(),set()}`; test with `.call(ctx)`
- queue.js: compaction triggers at `++offset * 2 >= array.length`
- cspAdaptor.ts: call `CspAdapterUtils.resetState()` in beforeEach
- select.js: `!top` truthy for `undefined` AND `0`; mock `getBoundingClientRect` on real HTMLElement
- time.ts: `diffFrom` while-loop second condition unreachable; use fixed anchor date (no clock mock)
- crypto/browserHashUtils.js: `hashObj({})` → '31e'; `hashObj({a:1})` → '1b0fmfe'
- crypto/index.js: Buffer.from !== Uint8Array.from in Node.js 22; URL alphabet: 'a'→'YQ'
- router.js: `findMeta` handles both plain-object and array meta; getProductFromRoute uses regex `/^c-cluster-([^-]+)/`
- notification-handler.ts: store.getters['notifications/all'] is array; store.getters['prefs/get'] is function-getter
- notifications store: spy on `Storage.prototype` (not `window.localStorage`)
- modal.ts + slideInPanel.ts: `markRaw` returns same reference; use `jest.useFakeTimers()` for close() 500ms setTimeout
- wm.ts: `const enum Layout` works with isolatedModules; state() reads localStorage at init time
- prefs.js: `definitions` is module-level (not in state); use EXPANDED_GROUPS/NAMESPACE_FILTERS (array/object) to test clone; `clone()` on primitives returns same value; reset skips asCookie prefs
- action-menu.js: `anon` counter is module-level; provide `action` field in test data; `_execute` bulkAction fires only when resources.length>1 and !opts.alt
- i18n.js: `intlCache` is module-level var; use unique keys per test to avoid cache pollution; mock `@shell/assets/translations/en-us.yaml` with `jest.mock(..., () => ({}))` since Jest has no YAML transformer; provide own translations in makeState()
- i18n.js actions: mock `@shell/utils/dynamic-importer` at top of file; `loadTranslation` returns module with `.default`; `switchTo` with locale already in state.translations skips `dispatch('load', ...)`; `switchTo(NONE)` commits immediately, skips prefs/set; load-fail with no i18nExt commits setSelected with DEFAULT_LOCALE
- useI18n.ts: `jest.setup.js` globally stubs `@shell/composables/useI18n`; add `jest.unmock('@shell/composables/useI18n')` BEFORE imports to bypass; mock `@shell/plugins/i18n` for stringFor; module-level `store` is shared — tests are order-dependent but safe since each test sets store via useI18n()
- auth.js: `jest.mock('@shell/utils/uiplugins', ...)` needed for isLoggedIn; store getters with schemaFor are function-getters (return functions, not values); `notLoggedIn` — 'index'.includes('auth')=false so setAuthRedirect IS called for index route; `openAuthPopup` deferred (Popup + BroadcastChannel complexity)
- favicon.js: `favIconSet` and `defaultFavIcon` are module-level; use `jest.resetModules()` + dynamic `require()` in beforeEach; mock `@shell/utils/require-asset`; use `link.getAttribute('href')` (not `link.href`) to avoid jsdom URL resolution
- useLabeledFormElement.ts: no lifecycle hooks, no store — use ref/computed directly; `raised` is initialized once (not reactive to prop changes); `rule.name` detection requires named `function` declarations not arrow functions; `rule(value)` at line 115 is NOT null-guarded (code inconsistency); emit is jest.Mock for 'update:validation'
- grafana.js: mock `@shell/utils/monitoring` with `jest.mock()`; `dashboardExists` URL must contain proxy path for `split(delimiter)` to work; unused imports cause no-unused-vars lint failures
- grafana.js: `dashboardExists`'s `projectId = null` default param needs an explicit JSDoc `@param {string | null} [projectId]` — otherwise TS narrows the inferred type to `null` and any test/call passing a string projectId is a new type-check error (caught PR #18972 CI failure this way; fixed via JSDoc, not test change)
- project-permissions.ts: `fetchProjectMembershipPermissions` is a plain async function taking `(store, projectId?)`; mock `store.getters['management/schemaFor']` and `store.dispatch`; response shape varies — array response (`res.data`) for all-projects listing vs single object (`res.id`) for one-project lookup; fails closed (returns `{}`) on missing collection link or dispatch rejection — spy/mock `console.warn` in beforeEach/afterEach to avoid noisy test output

## Testing Notes (composables)

- useFormValidation.ts: `provide()` outside component context warns but doesn't throw; spy on console.warn in beforeEach
- useFormValidation.ts: mock `vee-validate` (`useForm`) and `@shell/utils/validators/formRules/index` (default export); NODE_ENV='production' → nullValidator for unknown rules
- useRuntimeFlag.ts: `featureDropdownMenu` is module-level computed; use `jest.resetModules()` + `jest.mock('@shell/utils/version', ...)` + dynamic `require()` in beforeEach to get fresh computed per test
- useLabeledSelect.ts: mock `@shell/utils/width` (getWidth/setWidth); use `jest.spyOn(el, 'querySelector')` for DOM mocking; `await nextTick()` after resizeHandler to flush callback
- useI18n.ts: needs `jest.unmock('@shell/composables/useI18n')` at top (jest.setup.js stubs it globally); mock `@shell/plugins/i18n`; null-store path: use try/catch on `useI18n(null)` to get store=null after getting t reference
- useClickOutside.ts: mount composable in defineComponent wrapper with @vue/test-utils; jsdom has no PointerEvent — use `new MouseEvent('pointerdown', ...)` instead; override target+composedPath via Object.defineProperty; ignore selectors only affect shouldListen via detail=0 or pointerdown paths (not direct click with detail=1)

## Testing Notes (crypto)

- encryption.ts: polyfill `globalThis.crypto` from `import { webcrypto } from 'crypto'` in `beforeAll` — jsdom has no Web Crypto API; Node 24 does
- encryption.ts: use real crypto (not mocked); tamper tests verify AES-GCM authentication tag rejection

- projectAndNamespaceFiltering.utils.ts: rootGetters is plain object (bracket notation), not function; mock with `{ currentProduct: {...}, 'management/byId': () => ({...}) }`; exclude param overwrites include when both present
- useUserRetentionValidation.ts: mock `@shell/composables/useI18n` and `vuex`; `parseDuration` regex `^(\d+)h|(\d+)m|(\d+)s$` uses alternation (not fully anchored), so `6h30m` matches `6h`; split it.each into separate pass/fail blocks to satisfy jest/no-conditional-expect

## Testing Backlog (Prioritized)

1. `shell/utils/uiplugins.ts` — async polling loops (`waitForUIExtension`, `waitForUIPackage`, `createHelmRepository`, `getHelmChart`) — require fake timers + retry sequencing (deferred)
2. `shell/utils/crypto/index.js` — `md5`, `sha256`, `hash` (require Md5/Sha256 browser class mocking; deferred)
3. `shell/utils/auth.js` — `openAuthPopup` only (deferred; Popup + BroadcastChannel mocking)
4. `shell/composables/drawer.ts` — thin store wrapper (low value)
5. `shell/utils/grafana.js` — `allDashboardsExist` (skipped; thin wrapper over dashboardExists)
6. `shell/utils/custom-validators.js` — thin lookup object mapping validator names to imported functions (low value; check if individual validators under `shell/utils/validators/` already have coverage before skipping)
7. `shell/utils/v-sphere.ts` — DONE 2026-09-24 (see Completed Work)

## Completed Work (Summary — recent only)

- 2026-09-24: PR (test-assist/v-sphere-utils-tests): 11 new tests for VSphereUtils (handleVsphereCpiSecret/handleVsphereCsiSecret); 0%→99.3% stmts, 0%→67.7% branches, 0%→100% fns. Tests reach private methods (findSecret/findOrCreateSecret/findChartValues) only via the two public entry points since class methods are `private`. Noted (no code change): `findOrCreateSecret` always dispatches `management/create` with whatever was found/built — it doesn't do an update-in-place despite what "reuse" implies from the name.
- 2026-09-24: Posted comment on PR #18972 with the exact JSDoc fix for its type-check CI failure — could NOT push directly this run (git network access to github.com blocked: `git fetch`/`git checkout -b pr-branch` fails with 403 CONNECT tunnel). CORRECTION: the 2026-09-23 memory entry claiming this fix was already pushed to #18972 was WRONG — verified via MCP `list_commits`/`get_file_contents` that no such commit exists on the PR branch and master's grafana.js still lacks the JSDoc annotation. Root cause of the confusion unclear; always verify pushed-fix claims against actual branch commits before trusting past memory.
- 2026-09-23: PR (test-assist/project-permissions-tests): 9 new tests for `fetchProjectMembershipPermissions`; 0%→100% stmts/fns/lines, 0%→82.6% branches.
- 2026-09-01: PR (test-assist/array-extra-tests): 30 new tests for array.ts findStringIndex, hasDuplicatedStrings, sameArrayObjects, concatStrings; 75.51%→100% stmts, 78.94%→100% fns.
- 2026-08-27: PR (test-assist/grafana-utils-tests): 17 new tests for grafana.js; 28%→94% stmts, 100% branches, 30%→90% fns. CI type-check fails (TS2345 in test file) — needs JSDoc fix, still unresolved as of 2026-09-24 (see above).
- 2026-08-21: PR (test-assist/uiplugins-extra-tests): 14 new tests for uiplugins.ts; 34%→55% stmts.
- 2026-08-20: PR (test-assist/sort-utils-extra-tests): 56 tests for sort.js; 79%→98% stmts.
- 2026-08-19: PR (test-assist/project-ns-filtering-utils-tests): 23 tests; 0%→100%.
- 2026-08-13: PR (test-assist/settings-utils-tests): 13 tests for settings.ts; 50%→100%.
- Earlier (Aug/Jul): many PRs for i18n, focusTrap, useInterval, encryption, auth, etc. — all merged ✅

## Testing Notes (v-sphere)

- v-sphere.ts: `VSphereUtils` class methods are all `private` except `handleVsphereCpiSecret`/`handleVsphereCsiSecret` — test only through those two public entry points, don't try bracket-notation access to private methods (TS blocks it even at runtime it's fine, but cleaner to stay black-box)
- v-sphere.ts: `PROVISIONING_PRE_BOOTSTRAP` from `@shell/store/features.js` is just the string `'provisioningprebootstrap'` — mock `$store.getters['features/get']` to return true/false directly, no need to import/mock the features module
- v-sphere.ts: `findOrCreateSecret` ALWAYS dispatches `management/create` — even when `findSecret` finds an existing match, it passes that found secret's plain data (not a resource with setData/save) into `management/create` and uses the returned resource for setData/save. It's not a real "reuse" — more like "recreate from found data". Mock `$store.dispatch` to resolve `management/request` with `{ data: [...] }` first, then `management/create` with a `{ setData: jest.fn(), save: jest.fn() }` object second.
- v-sphere.ts: CSI secret's `configTemplateString` requires all of `username, password, host, datacenters` truthy or throws; `port`/`insecureFlag` are NOT required-checked but interpolated

## Environment Notes

- **No network git access**: `git fetch origin ...` fails with `403 CONNECT tunnel failed` in this sandbox. Cannot checkout/append commits to existing open PR branches (`push_to_pull_request_branch` requires a local checkout of that exact branch first). When an existing Test Improver PR has a CI fix needed, post the fix as a PR comment instead of trying to push it, and verify via MCP tools (list_commits/get_file_contents) whether a claimed prior fix actually landed before trusting old memory notes.

## Task Round-Robin History (recent)

- 2026-09-24: Task 3 (new PR: v-sphere.ts) + Task 4 (commented fix on #18972, verified #19213 CI green) + Task 7
- 2026-09-23: Task 3 (new PR + PR fix/maintenance) + Task 7
- 2026-09-01: Task 3 + Task 7
- 2026-08-27: Task 3 + Task 7
- 2026-08-21: Task 3 + Task 7
- 2026-08-20: Task 3 + Task 7
- 2026-08-19: Task 3 + Task 7
- 2026-08-13: Task 3 + Task 7
- 2026-06-30: Task 2+3 + Task 7
- Earlier: various Task 3+4+7

## Monthly Activity Issue

- June 2026 issue: #17976 (closed)
- July 2026 issue: #18236 (closed - new month)
- August 2026 issue: #18800 (closed - new month)
- September 2026 issue: created this run (closed August's, opened new)

## Maintainer Priorities

No specific priorities communicated yet.
