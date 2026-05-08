# Test Improver Memory

## Commands (Validated)

- **Install**: `yarn --ignore-engines install --frozen-lockfile`
- **Unit tests (single file)**: `node_modules/.bin/jest --no-coverage <path>`
- **Unit tests (all)**: `yarn --ignore-engines test:ci` (may fail due to engine check; prefer jest directly)
- **Lint single file**: `node_modules/.bin/eslint --max-warnings 0 <file>`
- **Coverage**: add `--collectCoverage --coverageDirectory /tmp/coverage --collectCoverageFrom <file>` to jest invocation
- **Test framework**: Jest + TypeScript (ts-jest)
- **Node**: v20 (engine requires >=24, use --ignore-engines or call jest directly)
- **IMPORTANT**: `yarn test:ci` fails with engine check; use `node_modules/.bin/jest` directly
- **IMPORTANT**: `node_modules/` does NOT exist on fresh clone; must run `yarn --ignore-engines install --frozen-lockfile` first

## Testing Notes

- Tests go in `__tests__/` subdirectory, named `<file>.test.ts`
- Use `toStrictEqual` (not `toEqual`), `toHaveBeenCalledWith` (not `toHaveBeenCalled`)
- `it.each` for tabular test cases
- `shallowMount` preferred for component tests
- TypeScript required for new tests
- ESLint rule: describe block names must be lowercase (`jest/lowercase-name`)
- ESLint rule: `toThrow()` requires a message/constructor (`jest/require-to-throw-message`) — use `.toThrow(Error)`
- ESLint rule: key-spacing enforced in object literals — use `eslint --fix` to auto-fix
- ESLint rule: `object-curly-newline` — inline single-property objects; use `eslint --fix` to auto-fix
- ESLint rule: `jest/prefer-called-with` — use `toHaveBeenCalledWith(...)` not `toHaveBeenCalled()`
- ESLint rule: `padding-line-between-statements` — use `eslint --fix` to auto-fix spacing
- ESLint rule: `jest/prefer-to-be-null` — use `toBeNull()` not `toStrictEqual(null)`
- ESLint rule: `jest/prefer-to-be-undefined` — use `toBeUndefined()` not `toStrictEqual(undefined)`
- Mock `Date.now` with `jest.spyOn(Date, 'now').mockReturnValue(timestamp)` for time-dependent tests
- `jest.restoreAllMocks()` in `afterEach` (or `beforeEach`) when using `spyOn`
- Math.floor on negative floats rounds toward -infinity (e.g. floor(-200.6) = -201)
- EXT.USER_ACTIVITY = 'ext.cattle.io.useractivity' (from shell/config/types.js)
- For async util tests: mock store.dispatch, mock resource.save; always run `eslint --fix` before linting check
- inactivity.ts: Inactivity class exported as named export; use named export (not default singleton) in tests

## Testing Notes (additional)

- For async util tests with `_status` errors: use `Object.assign(new Error('msg'), { _status: code })` to satisfy `prefer-promise-reject-errors` ESLint rule while keeping `_status` property accessible
- For abstract class params (e.g. PaginationParam), use plain object cast as `unknown as PaginationParam` — avoids needing class constructors in tests
- pagination-utils.ts exports `new PaginationUtils()` singleton; pure methods (validateNsProjectFilter, paginationEqual, etc.) need no mocks; store-dependent methods (isEnabled, isSteveCacheEnabled) need Vuex mock
- settings.ts: `getPerformanceSetting` takes `Record<string, (arg0: string, arg1: string) => any>` as rootGetters; `isProviderEnabled` takes `ClusterProvisionerContext` (from `@shell/core/types` which re-exports from `@shell/core/types-provisioning`)
- ClusterProvisionerContext can be mocked as `{ getters: { 'management/byId': fn }, dispatch: {}, axios: {}, $plugin: {}, $extension: {} } as unknown as ClusterProvisionerContext`
- fleet.ts: bundleDeploymentState logic is ported from Go; all test scenarios (ready/errapplied/waitapplied/notready/outofsync/modified) verified
- fleet.ts: resourcesFromBundleDeploymentStatus uses resourceKey(r) = `kind/namespace/name`; a resource appearing in both `resources` and `modifiedStatus` has its state updated in-place
- gc singletons (gc-interval, gc-route-changed): use `jest.resetModules()` + `jest.mock('../gc')` in `beforeEach` for isolation; use `jest.useFakeTimers()` for interval tests
- gc-route-changed.ts has a bug: `getResourceFromRoute` uses `match[2]` but regex only has 1 capture group → resource from `to.name` always undefined (existing behavior documented in test)
- style.ts: `isHigherAlert` uses ordered array ['info','success','warning','error']; 'disabled' is NOT in this array so indexOf returns -1 — 'disabled' is never considered "higher" than any named color
- perf-setting.utils.ts: exports two singletons (incrementalLoadingUtils, manualRefreshUtils); isEnabled = `!paginationEnabled && perfSettings[this.setting].enabled`; SSP (pagination) takes precedence when enabled
- ingress.ts: IngressDetailEditHelper class; findAndMapCerts and findAndMapServiceTargets are pure methods; fetchServices/fetchSecrets need Vuex store mock (skip for unit tests); constructor takes $store and namespace but pure methods don't use them
- units.js: `parseSi('1m', {allowFractional:false})` returns 1_000_000 (Mega) because 'm'.toUpperCase()==='M' is in UNITS — falls through to multiply path; `createMemoryValues('0','0').units` returns 'iB' (UNITS[0]='' + suffix='iB')
- parse-externalid.js: EXTERNAL_ID.KIND_CATALOG is undefined in that file's EXTERNAL_ID object → old-style parse returns kind=undefined (bug); default-library-group for catalog is dead code
- parse-externalid.js: parseHelmExternalId expects format `kind:///key=val&key=val` (3 slashes, no ?, keys parsed as nm=vl pairs)
- duration.js: `toMilliseconds('0')` returns 0 (regex matches but all groups undefined); `toSeconds` uses Math.floor so sub-second inputs return 0

## Testing Backlog (Prioritized)

1. `shell/utils/fleet.ts` store-dependent methods — `detailLocation`, `getResourcesDefaultState`, `getBundlesDefaultState` (follow-up to PR #17466)
2. `shell/utils/pagination-utils.ts` store methods — `isEnabled`, `isSteveCacheEnabled`, `isDownstreamSteveCacheEnabled` require Vuex mock (follow-up to PR #17431)
3. `shell/utils/gc/gc-root-store.js` — gc store integration
4. `shell/utils/ingress.ts` — `fetchServices`/`fetchSecrets` store-dependent methods (follow-up to #17518)
5. Additional utils — `promise.js`, `socket.js`, validators sub-modules

## Completed Work

### 2026-05-08
- Submitted PR (branch test-assist/duration-externalid-utils-tests): 39 unit tests for shell/utils/duration.js and shell/utils/parse-externalid.js
- Coverage: duration.js 0% → 100%; parse-externalid.js 0% → 97.84% stmts, 94.73% branches, 100% fns
- All 8 previously open PRs merged today by marcelofukumoto ✅

### 2026-05-07
- Submitted PR #17545 (branch test-assist/units-utils-tests): 57 unit tests for shell/utils/units.js
- Coverage: 0% → 90.15% stmts, 0% → 90.47% branches, 0% → 100% functions

### 2026-05-06
- Submitted PR #17518 (branch test-assist/perf-ingress-utils-tests): 21 unit tests for shell/utils/perf-setting.utils.ts and shell/utils/ingress.ts pure methods
- Coverage: 0% → 100% stmts/branches/fns/lines for perf-setting.utils.ts; 0% → 100% branches for ingress.ts pure methods

### 2026-05-05
- Submitted PR #17499 (branch test-assist/style-utils-tests): 43 unit tests for shell/utils/style.ts
- Coverage: 0% → 100% stmts/branches/fns/lines
- Notable: documented 'disabled' edge case in isHigherAlert (not in order array)

### 2026-05-04
- Submitted PR #17478 (branch test-assist/gc-companion-tests): 16 unit tests for gc-interval.ts and gc-route-changed.ts
- Coverage: 0% → 100% stmts/fns/lines, 95% branches for both files
- Notable: documented match[2] bug in gc-route-changed.ts

### 2026-05-03
- Submitted PR #17471 (branch test-assist/gc-utils-tests): 30 unit tests for shell/utils/gc/gc.ts
- Coverage: 0% → 94.68% stmts, 0% → 100% fns, 0% → 86.56% branches

### 2026-05-02
- Submitted PR #17466: 40 unit tests for shell/utils/fleet.ts (branch test-assist/fleet-utils-tests)
- Coverage: 52% → 80% stmts, 17% → 83% fns, 85% branches (77 total)

### 2026-05-01
- Submitted PR #17451: 12 unit tests for shell/utils/settings.ts (branch test-assist/settings-utils-tests)
- Coverage: 0% → 50% stmts, 33% fns, 92% branches
- Closed April 2026 Monthly Activity issue #17177; created May 2026 issue #17452

### 2026-04-30 (confirmed)
- PR #17412 (git.ts tests) merged by nwmac ✅

### 2026-04-22
- PR #17176 (url.ts, 38 tests) merged by nwmac ✅

## Task Round-Robin History

- 2026-05-08: Task 3 (duration.js + parse-externalid.js, 39 tests) + Task 4 (confirmed all 8 PRs merged) + Task 7 (monthly update)
- 2026-05-07: Task 3 (units.js 57 tests, 90.15% stmts) + Task 4 (PR CI check: #17431/#17499 all green) + Task 7 (monthly activity update)
- 2026-05-06: Task 3 (perf-setting.utils + ingress.ts pure methods, 21 tests) + Task 4 (PR CI check: all passing) + Task 7 (monthly activity update)
- 2026-05-05: Task 3 (style.ts 43 tests, 100% all) + Task 4 (PR CI check) + Task 7 (monthly activity update)
- 2026-05-04: Task 3 (gc-interval.ts + gc-route-changed.ts, 16 tests, 100% stmts) + Task 7 (monthly activity update)
- 2026-05-03: Task 3 (gc.ts 30 tests, 94.68% stmts, 100% fns) + Task 7 (monthly activity update)
- 2026-05-02: Task 4 (PR CI check) + Task 3 (fleet.ts 40 tests, 80% stmts) + Task 7 (monthly activity update)
- 2026-05-01: Task 3 (settings.ts 12 tests, 92% branches) + Task 4 (PR maintenance check) + Task 7 (monthly activity May)
- 2026-04-30: Task 3 (pagination-utils.ts 43 tests, 50% stmts) + Task 7 (monthly activity update)

## Monthly Activity Issue

- Issue for May 2026: #17452 (created 2026-05-01)
- Issue #17177: closed 2026-05-01 (was April 2026)
- PR (branch test-assist/duration-externalid-utils-tests): duration.js + parse-externalid.js — submitted 2026-05-08, PR number TBD
- All prior PRs (#17431, #17451, #17466, #17471, #17478, #17499, #17518, #17545): merged 2026-05-08 ✅

## Maintainer Priorities

None noted yet.
