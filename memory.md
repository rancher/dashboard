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

1. `shell/utils/crypto/index.js` — `md5`, `sha256`, `hash` (require Md5/Sha256 browser class mocking; deferred)
2. `shell/utils/auth.js` — `openAuthPopup` only (deferred; Popup + BroadcastChannel mocking)
3. `shell/composables/drawer.ts` — thin store wrapper (low value)

## Completed Work (Summary)

- 2026-08-20: PR (test-assist/sort-utils-extra-tests): 56 new tests for sort.js typeOf, compare, parseField, sortableNumericSuffix, isNumeric; 79%→98% stmts, 41%→96% branches, 78%→100% fns.
- 2026-08-19: PR (test-assist/project-ns-filtering-utils-tests): 23 new tests for projectAndNamespaceFiltering.utils.ts — isApplicable, isEnabled, createParam, checkAndCreateParam; 0%→100% stmts/fns/lines, 92.59% branches.
- 2026-08-13: PR (test-assist/settings-utils-tests): 13 new tests for settings.ts async functions — fetchOrCreateSetting, fetchSetting, fetchInitialSettings, setSetting; 50%→100% stmts, 33%→100% fns.
- 2026-08-12: PR (test-assist/i18n-store-actions-tests): 23 new tests for i18n.js actions — init, load, mergeLoad, switchTo; 72%→92.17% stmts, 83%→100% fns, 98.5%→94.49% branches.
- 2026-08-10: PR (test-assist/focus-trap-composable-tests): 19 new tests for focusTrap.ts — getFirstFocusableElement, useBasicSetupFocusTrap lifecycle, useWatcherBasedSetupFocusTrapWithDestroyIncluded; 0%→100% all metrics.
- 2026-08-07: PR (test-assist/use-interval-composable-tests): 6 new tests for useInterval.ts — lifecycle mount/unmount, delay accuracy, multiple instances; 0%→100% all metrics.
- 2026-08-06: PR (test-assist/encryption-utils-tests): 14 new tests for encryption.ts
- 2026-08-05: PR (test-assist/user-retention-validation-tests): 27 new tests for useUserRetentionValidation.ts — cron validation, duration format validation, 336h minimum enforcement, session TTL comparison; 0%→97.4% stmts, 89.5% branches, 100% fns
- 2026-07-30: PR (test-assist/click-outside-composable-tests): 12 new tests for useClickOutside.ts — click outside, on element, inside element, null ref, ignore selectors, keyboard click (detail=0), lifecycle mount/unmount; 0%→95% stmts, 0%→94% branches, 0%→100% fns
- 2026-07-04: PR (test-assist/labeled-form-element-composable-tests): 30 new tests for useLabeledFormElement.ts — raised/focused state, validation messages, required-field detection, emit assertions; 0%→100% stmts/lines, 93.33% branches
- 2026-07-03: PR #18267 (test-assist/favicon-utils-tests): 15 new tests for favicon.js — haveSetFavIcon state, setFavIcon brand selection (suse/csp/harvester), findIconLink; 0%→100% stmts/fns, 94.7% branches
- 2026-07-02: PR #18249 (test-assist/auth-utils-tests): 25 new tests for auth.js — checkSchemasForFindAllHash, canViewResource, authProvidersInfo, findMe, noAuth, notLoggedIn, isLoggedIn, tryInitialSetup; ~35%→82.82% stmts, 95.91% branches
- 2026-07-01: PR #18235 (test-assist/usei18n-composable-tests): 10 tests for useI18n.ts; 0%→100% all metrics
- 2026-06-30: PR #18210 (test-assist/runtime-flag-labeled-select-tests): 29 tests for useRuntimeFlag.ts + useLabeledSelect.ts; 0%→100% stmts/fns
- 2026-06-29: PR #18202 (test-assist/form-validation-composable-tests): 17 tests for useFormValidation.ts; 0%→100% all metrics — merged ✅
- 2026-06-28: PR #18197 (test-assist/i18n-store-tests): 51 tests for i18n.js; 0%→72% stmts, 98.5% branches, 83% fns — merged ✅
- 2026-06-27: PR #18196 (test-assist/prefs-store-tests): 67 tests for prefs.js — merged ✅
- 2026-06-26: PR #18184 (test-assist/action-menu-store-tests): 53 tests for action-menu.js — merged ✅
- Earlier PRs: all merged ✅

## Task Round-Robin History

- 2026-08-20: Task 3 (sort.js extra tests, 56 tests, 79%→98% stmts, 41%→96% branches, 78%→100% fns) + Task 7
- 2026-08-19: Task 3 (projectAndNamespaceFiltering.utils.ts, 23 tests, 0%→100% stmts/fns/lines) + Task 7
- 2026-08-13: Task 3 (settings.ts async functions, 13 tests, 50%→100% stmts, 33%→100% fns) + Task 7
- 2026-08-10: Task 3 (focusTrap.ts, 19 tests, 0%→100%) + Task 7
- 2026-08-07: Task 3 (useInterval.ts, 6 tests) + Task 7
- 2026-08-06: Task 3 (encryption.ts, 14 tests) + Task 7
- 2026-08-05: Task 3 (useUserRetentionValidation.ts, 27 tests) + Task 7 (new month: created August issue #aw_aug2026)
- 2026-07-30: Task 3 (useClickOutside.ts, 12 tests) + Task 7
- 2026-07-04: Task 4 (all 4 PRs CI green) + Task 3 (useLabeledFormElement.ts, 30 tests) + Task 7
- 2026-07-03: Task 4 + Task 3 (favicon.js, 15 tests) + Task 7
- 2026-07-02: Task 4 + Task 3 (auth.js, 25 tests) + Task 7
- 2026-07-01: Task 4 + Task 3 (useI18n.ts, 10 tests) + Task 7 (new month)
- 2026-06-30: Task 2+3 + Task 7
- Earlier: various Task 3+4+7

## Monthly Activity Issue

- June 2026 issue: #17976 (closed)
- July 2026 issue: #18236 (closed - new month)
- August 2026 issue: #18800 (open)

## Maintainer Priorities

No specific priorities communicated yet.
