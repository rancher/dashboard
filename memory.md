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
- type-map.utils.ts: `rowValueGetter` fields matching `$.metadata.fields[N]` → fast path; `configureConditionalDepaginate` Norman types need `management.cattle.io.` prefix

## Testing Backlog (Prioritized)

1. `shell/utils/crypto/index.js` — `md5`, `sha256`, `hash` (require Md5/Sha256 browser class mocking; deferred)
2. `shell/utils/auth.js` — remaining functions: `openAuthPopup`, `checkSchemasForFindAllHash`, `canViewResource`, etc.
3. `shell/store/type-map.utils.ts` — `createHeaders`, `headerFromSchemaColString` (full Vuex store mock)
4. `shell/utils/favicon.js` — DOM-based favicon logic (medium priority)
5. `shell/store/prefs.js` remaining actions — `set`, `loadServer`, `loadTheme`, `setBrandStyle`

## Completed Work (Summary)

- 2026-06-27: PR (test-assist/prefs-store-tests): 67 tests for prefs.js; 0%→~65% stmts, ~80% branches
- 2026-06-26: PR #18184 (test-assist/action-menu-store-tests): 53 tests for action-menu.js — merged ✅
- 2026-06-25: PR #18164 (test-assist/ui-context-store-tests): 28 tests for ui-context.ts — merged ✅
- 2026-06-24: PR #18154 (test-assist/wm-store-tests): 57 tests for wm.ts — merged ✅
- 2026-06-23: PR #18142 (test-assist/notifications-actions-tests): 31 tests for notifications.ts actions — merged ✅
- 2026-06-22: PR #18117 (test-assist/features-store-tests): 12 tests for features.js — merged ✅
- 2026-06-21: PR #18112 (test-assist/modal-slidein-store-tests): 24 tests for modal.ts + slideInPanel.ts — merged ✅
- 2026-06-20: PR #18110 (test-assist/growl-store-tests): 29 tests for growl.js — merged ✅
- 2026-06-19: PR #18103 (test-assist/type-map-utils-tests): 41 tests for type-map.utils.ts
- 2026-06-18: PR #18092 (test-assist/notifications-store-tests): 49 tests for notifications store — merged ✅
- 2026-06-17: PR #18083 (test-assist/dynamic-importer-tests): 46 tests for dynamic-importer.js — merged ✅
- 2026-06-16: PR #18071 (test-assist/notification-handler-tests): 17 tests — merged ✅
- 2026-06-14: PR #18054 (test-assist/router-utils-tests): 32 tests for router.js — merged ✅
- 2026-06-13: PR #18053 (validators: 38 tests) — merged ✅
- 2026-06-12: PR #18041 (crypto: 35 tests) — merged ✅
- Earlier PRs: #18033, #18023, #18011, #17989, #17987, #17983, #17975, #17904, #17889, #17862, #17843, #17815, #17806, #17801 — all merged ✅

## Task Round-Robin History

- 2026-06-27: Task 3 (prefs.js store, 67 tests) + Task 7
- 2026-06-26: Task 3 (action-menu.js, 53 tests) + Task 7
- 2026-06-25: Task 3+4 (ui-context.ts, 28 tests) + Task 7
- 2026-06-24: Task 3 (wm.ts, 57 tests) + Task 7
- 2026-06-23: Task 3 (notifications.ts actions, 31 tests) + Task 7
- 2026-06-22: Task 3 (features.js, 12 tests) + Task 7
- 2026-06-21: Task 3+4 (modal.ts + slideInPanel.ts, 24 tests) + Task 7
- 2026-06-20: Task 3 (growl.js, 29 tests) + Task 7
- 2026-06-19: Task 3 (type-map.utils.ts, 41 tests) + Task 7
- 2026-06-18: Task 3 (notifications store, 49 tests) + Task 7
- 2026-06-15: Task 2+3 (auth.js, 24 tests) + Task 7

## Monthly Activity Issue

- May 2026 issue: #17452 (closed)
- June 2026 issue: #17976 (open)

## Maintainer Priorities

No specific priorities communicated yet.
