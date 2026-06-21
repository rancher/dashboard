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
- `promise/param-names` — use `resolve`/`reject`, not `r`/`rej`
- Use `eslint --fix` for key-spacing, object-curly-newline
- `jest/require-top-level-describe` — hooks must be inside describe
- `jest/no-conditional-expect` — no `if` around `expect()`

## Testing Notes

- validators mock: `{ 'i18n/t': (key, args) => args ? key+':'+JSON.stringify(args) : key, 'i18n/exists': () => false }`
- gc singletons: `jest.resetModules()` + `jest.mock('../gc')` in `beforeEach`
- gc-route-changed.ts bug: `match[2]` but regex only has 1 capture group
- parse-externalid.js: EXTERNAL_ID.KIND_CATALOG is undefined → kind=undefined (bug)
- duration.js: `toSeconds` uses Math.floor; sub-second inputs return 0
- platform.js: jsdom `navigator.platform=''` → isMac=false
- window.js: mock `window.screen` via Object.defineProperty; use jest.useFakeTimers() for Popup
- computed.js: `integerString`/`keyValueStrings` return `{get(),set()}`; test with `.call(ctx)`
- queue.js: compaction triggers at `++offset * 2 >= array.length`
- cspAdaptor.ts: call `CspAdapterUtils.resetState()` in beforeEach
- select.js: `!top` truthy for `undefined` AND `0`; mock `getBoundingClientRect` on real HTMLElement
- time.ts: `diffFrom` while-loop second condition unreachable; use fixed anchor date (no clock mock)
- crypto/browserHashUtils.js: `hashObj({})` → '31e'; `hashObj({a:1})` → '1b0fmfe'
- crypto/index.js: Buffer.from !== Uint8Array.from in Node.js 22; URL alphabet: 'a'→'YQ'
- validators/container-images.js: jobTemplate path `jobTemplate.spec.template.spec` vs `template.spec`
- validators/flow-output.js: verifyLocal mode checks both refs; global mode only globalOutputRefs
- validators/logging-outputs.js: logdna returns early for isEmpty(value); api_key must be non-empty
- validators/monitoring-route.js: interval regex `/^\d+[hms]$/`
- router.js: existing test file is .js not .ts; INSTALL_REDIRECT_META_KEY='installRedirect'
- router.js: `findMeta` handles both plain-object and array meta; getProductFromRoute uses regex `/^c-cluster-([^-]+)/`
- notification-handler.ts: store.getters['notifications/all'] is array (direct value); store.getters['prefs/get'] is function-getter; filter bug `!announcements.includes(v)` always passes through (comparing objects with strings)
- notifications store: spy on `Storage.prototype` (not `window.localStorage`) — jsdom localStorage methods are not spyable directly
- modal.ts + slideInPanel.ts: `markRaw` from vue returns same reference; no need to mock; use `jest.useFakeTimers()` for close() 500ms setTimeout

## Testing Notes (type-map.utils.ts)

- `rowValueGetter`: fields matching `$.metadata.fields[N]` → fast path; dot-prefixed fields → prepend `$`; escaped dots → `rewriteJsonPath`
- `rewriteJsonPath`: private function; rewrites `$.a.b\.c\.d` → `$.a.["b.c.d"]` for JSONPath library compat
- `configureConditionalDepaginate`: Norman types need `management.cattle.io.` prefix; uses `rootGetters['currentStore'](type)` then `all(COUNT)[0]?.counts[type]?.summary?.count`
- `headerFromSchemaCol`: age shortcut requires `ageColumn` to be truthy; label key lowercases first char; tooltip strips trailing `.`

## Testing Backlog (Prioritized)

1. `shell/utils/crypto/index.js` — `md5`, `sha256`, `hash` (require Md5/Sha256 browser class mocking; deferred)
2. `shell/utils/auth.js` — remaining functions: `openAuthPopup`, `checkSchemasForFindAllHash`, `canViewResource`, `findMe`, etc. (require store/BroadcastChannel mocking)
3. `shell/store/notifications.ts` actions — `add`, `fromGrowl`, `markRead`, `markUnread`, `markAllRead`, `remove`, `clearAll`, `init` (need BroadcastChannel + crypto mocking)
4. `shell/utils/favicon.js` — DOM-based favicon logic (low-medium priority)
5. `shell/store/type-map.utils.ts` — `createHeaders`, `headerFromSchemaColString` (require full Vuex store mock; follow-up)
6. `shell/store/features.js` — getter `get` (unknown feature error, management/byId lookup, default fallback) + `loadServer` action

## Completed Work (Summary)

- 2026-06-21: PR (branch test-assist/modal-slidein-store-tests): 24 tests for modal.ts + slideInPanel.ts; 0%→100% stmts/branches/lines
- 2026-06-20: PR #18110 (branch test-assist/growl-store-tests): 29 tests for growl.js store; 0%→100% stmts/branches/fns
- 2026-06-19: PR #18103 (branch test-assist/type-map-utils-tests): 41 tests for type-map.utils.ts; 0%→61% stmts, 96% branches, 71% fns
- 2026-06-18: PR #18092 (branch test-assist/notifications-store-tests): 49 tests for notifications store getters+mutations; 0%→57% stmts, 96% branches — merged ✅
- 2026-06-17: dynamic-importer.test.ts merged to master (46 tests for dynamic-importer.js; 0%→82% stmts)
- 2026-06-16: PR #18071 (branch test-assist/notification-handler-tests): 17 tests for notification-handler.ts; 100% coverage — merged ✅
- 2026-06-14: PR #18054 (branch test-assist/router-utils-tests): 32 tests for router.js — merged ✅
- 2026-06-13: PR #18053 (branch test-assist/validator-tests-container-flow-logdna-monitoring): 38 tests for 4 validator files — merged ✅
- 2026-06-12: PR #18041: 35 tests for crypto/browserHashUtils.js + crypto/index.js — merged ✅
- 2026-06-11: PR #18033: 32 tests for time.ts — merged ✅
- 2026-06-10: PR #18023: 11 tests for select.js — merged ✅
- 2026-06-09: PR #18011: 14 tests for cspAdaptor.ts — merged ✅
- 2026-06-08: PR #17989: 16 tests for release-notes.ts — merged ✅
- 2026-06-07: PR #17987: 23 tests for queue.js — merged ✅
- 2026-06-06: PR #17983: 22 tests for computed.js — merged ✅
- 2026-06-05: PR #17975: 22 tests for platform.js + window.js — merged ✅
- Earlier: #17904 (dom/width/title), #17889 (position), #17862 (monitoring), #17843 (string), #17815 (versions), #17806 (gc-root-store), #17801 (gatekeeper), all merged ✅

## Task Round-Robin History

- 2026-06-21: Task 3+4 (modal.ts + slideInPanel.ts, 24 tests; PR CI check — infra-only E2E failures) + Task 7
- 2026-06-20: Task 3 (growl.js store, 29 tests: state/getters/mutations/actions) + Task 7
- 2026-06-19: Task 3 (type-map.utils.ts, 41 tests: rowValueGetter/conditionalDepaginate/configureConditionalDepaginate/headerFromSchemaCol) + Task 7
- 2026-06-18: Task 3 (notifications store, 49 tests: getters+mutations) + Task 7
- 2026-06-17: Task 3 (dynamic-importer.js, 46 tests) + Task 7
- 2026-06-16: Task 3 (notification-handler.ts, 17 tests) + Task 7
- 2026-06-15: Task 2+3 (auth.js, 24 tests: parseAuthProvidersInfo/checkPermissions/returnTo) + Task 7
- 2026-06-14: Task 3 (router.js, 32 tests) + Task 7
- 2026-06-13: Task 3 (validators: container-images/flow-output/logging-outputs/monitoring-route, 38 tests) + Task 7
- 2026-06-12: Task 3 (crypto, 35 tests) + Task 7
- 2026-06-11: Task 3 (time.ts, 32 tests) + Task 7
- 2026-06-10: Task 3 (select.js, 11 tests) + Task 7
- 2026-06-09: Task 3 (cspAdaptor.ts, 14 tests) + Task 7
- 2026-06-07: Task 3 (queue.js, 23 tests) + Task 7
- 2026-06-06: Task 3 (computed.js, 22 tests) + Task 7
- 2026-06-05: Task 3 (platform.js + window.js, 22 tests) + Task 7

## Monthly Activity Issue

- May 2026 issue: #17452 (closed)
- June 2026 issue: #17976 (open)

## Maintainer Priorities

No specific priorities communicated yet.
