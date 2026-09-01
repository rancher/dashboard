# Test Improver Memory

## Commands (Validated)

- **Install**: `yarn --ignore-engines install --frozen-lockfile`
- **Unit tests (single file)**: `node_modules/.bin/jest --no-coverage <path>`
- **Lint single file**: `node_modules/.bin/eslint --max-warnings 0 <file>`
- **Coverage**: add `--collectCoverage --coverageDirectory /tmp/coverage --collectCoverageFrom <file>` to jest invocation
- **Test framework**: Jest + TypeScript (ts-jest)
- **IMPORTANT**: `yarn test:ci` fails with engine check; use `node_modules/.bin/jest` directly

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

## Completed Work (Summary — recent only)

- 2026-09-01: PR (test-assist/array-extra-tests): 30 new tests for array.ts findStringIndex, hasDuplicatedStrings, sameArrayObjects, concatStrings; 75.51%→100% stmts, 78.94%→100% fns.
- 2026-08-27: PR (test-assist/grafana-utils-tests): 17 new tests for grafana.js; 28%→94% stmts, 100% branches, 30%→90% fns.
- 2026-08-21: PR (test-assist/uiplugins-extra-tests): 14 new tests for uiplugins.ts; 34%→55% stmts.
- 2026-08-20: PR (test-assist/sort-utils-extra-tests): 56 tests for sort.js; 79%→98% stmts.
- 2026-08-19: PR (test-assist/project-ns-filtering-utils-tests): 23 tests; 0%→100%.
- 2026-08-13: PR (test-assist/settings-utils-tests): 13 tests for settings.ts; 50%→100%.
- Earlier (Aug/Jul): many PRs for i18n, focusTrap, useInterval, encryption, auth, etc. — all merged ✅

## Task Round-Robin History (recent)

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
- August 2026 issue: #18800 (open)

## Maintainer Priorities

No specific priorities communicated yet.
