# Test Improver Memory

## Commands (Validated)

- **Install**: `yarn --ignore-engines install --frozen-lockfile`
- **Unit tests (single file)**: `node_modules/.bin/jest --no-coverage <path>`
- **Lint single file**: `node_modules/.bin/eslint --max-warnings 0 <file>`
- **Coverage**: add `--collectCoverage --coverageDirectory /tmp/coverage --collectCoverageFrom <file>` to jest invocation
- **Test framework**: Jest + TypeScript (ts-jest)
- **IMPORTANT**: `yarn test:ci` fails with engine check; use `node_modules/.bin/jest` directly
- **IMPORTANT**: `node_modules/` does NOT exist on fresh clone; must run install first

## ESLint Rules to Watch

- describe block names must be lowercase (`jest/lowercase-name`)
- `toThrow()` requires a message/constructor (`jest/require-to-throw-message`)
- `jest/prefer-called-with`, `jest/prefer-to-be-null`, `jest/prefer-to-be-undefined`, `jest/prefer-to-have-length`
- `promise/param-names` — Promise constructor params must be named `resolve`/`reject` (not `r`/`rej`)
- Use `eslint --fix` for key-spacing, object-curly-newline, padding-line-between-statements
- `jest/require-top-level-describe` — ALL hooks (beforeEach/afterEach) must be inside a describe block
- `jest/no-conditional-expect` — No `if` around `expect()` calls; use separate tests instead

## Testing Notes

- Tests go in `__tests__/` subdirectory, named `<file>.test.ts`; TypeScript required
- Use `toStrictEqual`, `toHaveBeenCalledWith`; `shallowMount` preferred for components
- validators/index.js: mock getters as `{ 'i18n/t': (key, args) => args ? key+':'+JSON.stringify(args) : key, 'i18n/exists': () => false }`
- alertmanagerconfig.js: pure fns (createDefaultRouteName, areRoutesSupportedFormat, canCreate) use real Buffer base64; async store-dependent fns need Vuex mock
- gc singletons: use `jest.resetModules()` + `jest.mock('../gc')` in `beforeEach` for isolation
- gc-route-changed.ts has a bug: `getResourceFromRoute` uses `match[2]` but regex only has 1 capture group
- parse-externalid.js: EXTERNAL_ID.KIND_CATALOG is undefined → old-style parse returns kind=undefined (bug)
- duration.js: `toMilliseconds('0')` returns 0; `toSeconds` uses Math.floor so sub-second inputs return 0
- units.js: `parseSi('1m', {allowFractional:false})` returns 1_000_000 (Mega not milli)
- perf-setting.utils.ts: isEnabled = `!paginationEnabled && perfSettings[this.setting].enabled`
- kube.js: normalizeName handles null/undefined via `(str || '')` pattern
- svg-filter.js: Solver.loss() resets reusedColor each call (safe to reuse); contrast(0) pushes black to mid-gray (127.5); stochastic solve() only asserts structural invariants
- sort.js: sort-utils.test.ts covers typeOf/spaceship/compare/parseField/sortableNumericSuffix/isNumeric; sort.test.ts covers sortBy
- gatekeeper/util.js: store mock via `{ getters: { ['cluster/all']: () => schemas }, dispatch: jest.fn() }`
- gc-root-store.js: mock gc/gc-interval/gc-route-changed via jest.resetModules()+jest.mock() in beforeEach inside describe
- versions.ts: singleton — use jest.resetModules()+jest.mock('@shell/config/version',...)` in beforeEach to reset; use makeStoreWithCalls(p1,p2) helper to control per-call dispatch results
- string.js: escapeHtml regex `/[&<>"']/g` does NOT include `/`, so `/` is not escaped (even though entityMap has it); escapeRegex escapes all `.*+?^${}()|[\]` chars; formatPercent: value<1 AND maxPrecision>=2 → 2 decimal places; value<10 AND maxPrecision>=1 → 1 decimal place; else round
- monitoring.js: hasEndpointSubsets returns `undefined` (not `false`) when endpoint not found or subsets undefined — short-circuit &&; use toBeFalsy() for those cases; haveV2Monitoring mocks: getters['getStoreNameByProductId']=storeName, getters[`${storeName}/all`]=(type)=>schemas
- position.js: fitOnScreen uses `triggerElemOrEvent instanceof Event` — must pass real `new MouseEvent(...)` not plain object; use `useDefaults=true` to avoid needing real DOM contentElem; mock window.innerWidth/Height with Object.defineProperty; TOP→BOTTOM fallback IS implemented when gapIf.top<0

## Testing Backlog (Prioritized)

1. `shell/utils/fleet.ts` store-dependent methods — detailLocation, getResourcesDefaultState, getBundlesDefaultState
2. `shell/utils/ingress.ts` — fetchServices/fetchSecrets store-dependent methods
3. `shell/utils/dom.js` — DOM manipulation utilities

## Completed Work (Summary)

- 2026-05-29: PR (branch test-assist/position-utils-tests): 21 tests for position.js; 87.2% stmts, 67.5% branches, 75% fns
- 2026-05-28: PR (branch test-assist/monitoring-utils-tests): 14 tests for monitoring.js; 84.1% stmts, 92.3% branches, 87.5% fns
- 2026-05-27: PR (branch test-assist/string-utils-tests): 116 tests for string.js untested fns; 89.4% stmts, 98.2% branches combined
- 2026-05-25: PR (branch test-assist/versions-utils-tests): 10 tests for versions.ts; 100% all metrics
- 2026-05-24: PR #17806 (branch test-assist/gc-root-store-tests): 15 tests for gc-root-store.js; 100% all metrics
- 2026-05-23: PR #17801 (branch test-assist/gatekeeper-util-tests): 14 tests for gatekeeper/util.js; 100% all metrics
- 2026-05-22: PR (branch test-assist/sort-utils-tests): 47 tests for sort.js utility fns; ~86% stmts, ~94% branches
- 2026-05-21: PR (branch test-assist/banners-utils-tests): 15 tests for banners.js; 100% all metrics
- 2026-05-20: PR (branch test-assist/poller-tests): 32 tests for Poller and PollerSequential; 98.9% stmts, 75% branches, 89.5% fns
- 2026-05-19: PR #17729 (branch test-assist/svg-filter-tests): 18 tests for svg-filter.js Solver class — MERGED ✅
- 2026-05-18: PR #17712 (branch test-assist/alertmanagerconfig-tests): 12 tests for alertmanagerconfig.js pure fns — MERGED ✅
- 2026-05-17: PR #17699 (branch test-assist/aws-kube-utils-tests): 29 tests for aws.ts + kube.js; 100% all metrics — MERGED ✅
- 2026-05-16: PR #17692 (branch test-assist/namespace-filter-async-tests): 20 tests for namespace-filter.js + async.ts — MERGED ✅
- All PRs #17431–#17729: merged ✅

## Task Round-Robin History

- 2026-05-29: Task 3 (position.js, 21 tests) + Task 7
- 2026-05-28: Task 3 (monitoring.js, 14 tests) + Task 7
- 2026-05-27: Task 3 (string.js, 116 tests) + Task 7
- 2026-05-25: Task 3 (versions.ts, 10 tests) + Task 7
- 2026-05-24: Task 3 (gc-root-store.js, 15 tests) + Task 7
- 2026-05-23: Task 3 (gatekeeper/util.js, 14 tests) + Task 7
- 2026-05-22: Task 3 (sort.js, 47 tests) + Task 7
- 2026-05-21: Task 3 (banners.js, 15 tests) + Task 7
- 2026-05-20: Task 3 (poller.js + poller-sequential.js, 32 tests) + Task 4 + Task 7
- 2026-05-19: Task 3 (svg-filter.js, 18 tests) + Task 4 + Task 7
- 2026-05-18: Task 3 (alertmanagerconfig.js, 12 tests) + Task 7
- 2026-05-17: Task 3 (aws.ts + kube.js, 29 tests) + Task 4 + Task 7
- 2026-05-16: Task 3 (namespace-filter.js + async.ts, 20 tests) + Task 7

## Monthly Activity Issue

- May 2026 issue: #17452 (open)

## Maintainer Priorities

No specific priorities communicated yet.
