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

## Testing Backlog (Prioritized)

1. `shell/utils/versions.ts` — singleton fetch with promise caching, store dispatch mock needed
2. `shell/utils/fleet.ts` store-dependent methods — detailLocation, getResourcesDefaultState, getBundlesDefaultState
3. `shell/utils/pagination-utils.ts` — ALREADY TESTED (existing test file)
4. `shell/utils/ingress.ts` — fetchServices/fetchSecrets store-dependent methods

## Completed Work (Summary)

- 2026-05-24: PR (branch test-assist/gc-root-store-tests): 15 tests for gc-root-store.js; 100% all metrics
- 2026-05-23: PR #17801 (branch test-assist/gatekeeper-util-tests): 14 tests for gatekeeper/util.js; 100% all metrics
- 2026-05-22: PR (branch test-assist/sort-utils-tests): 47 tests for sort.js utility fns (typeOf, spaceship, compare, parseField, sortableNumericSuffix, isNumeric); ~86% stmts, ~94% branches
- 2026-05-21: PR (branch test-assist/banners-utils-tests): 15 tests for banners.js; 100% all metrics
- 2026-05-20: PR (branch test-assist/poller-tests): 32 tests for Poller and PollerSequential; 98.9% stmts, 75% branches, 89.5% fns
- 2026-05-19: PR #17729 (branch test-assist/svg-filter-tests): 18 tests for svg-filter.js Solver class — MERGED ✅
- 2026-05-18: PR #17712 (branch test-assist/alertmanagerconfig-tests): 12 tests for alertmanagerconfig.js pure fns — MERGED ✅
- 2026-05-17: PR #17699 (branch test-assist/aws-kube-utils-tests): 29 tests for aws.ts + kube.js; 100% all metrics — MERGED ✅
- 2026-05-16: PR #17692 (branch test-assist/namespace-filter-async-tests): 20 tests for namespace-filter.js + async.ts — MERGED ✅
- 2026-05-15: PR (branch test-assist/validator-role-template-cron-tests): 19 tests for role-template.js + cron-schedule.js
- 2026-05-14: PR (branch test-assist/validator-tests-batch2): 79 tests for 6 validator modules
- 2026-05-13: PR (branch test-assist/kubernetes-cluster-name-tests): 37 tests for kubernetes-name.js + cluster-name.js
- 2026-05-12: PR (branch test-assist/validators-service-tests): 30 tests for service.js
- 2026-05-11: PR (branch test-assist/color-utils-tests): 32 tests for color.js
- 2026-05-10: PR #17590 (branch test-assist/promise-queue-utils-tests): 34 tests for promise.js + queue.js
- 2026-05-09: PR #17583: 56 tests for validators/index.js
- 2026-05-08: PR #17562: 39 tests for duration.js + parse-externalid.js
- 2026-05-07: PR #17545: 57 tests for units.js
- 2026-05-06: PR #17518: 21 tests for perf-setting.utils.ts + ingress.ts pure methods
- All PRs #17431–#17699: merged ✅

## Task Round-Robin History

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
- New PR (branch test-assist/gc-root-store-tests) pending

## Maintainer Priorities

No specific priorities communicated yet.
