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

## Testing Backlog (Prioritized)

1. `shell/utils/fleet.ts` (328 lines) — fleet.test.ts exists covering only `getTargetMode`; many methods untested (quacksLikeAHash, parseSSHUrl, resourceId, resourceType, bundleDeploymentState, resourcesFromBundleDeploymentStatus, clusterIdFromBundleDeploymentLabels, bundleIdFromBundleDeploymentLabels, getDashboardStateId, getDashboardState)
2. `shell/utils/pagination-utils.ts` store methods — isEnabled, isSteveCacheEnabled etc. require Vuex store mock (follow-up to PR #17431)
3. `shell/utils/gc/gc.ts` — garbage collection logic, store-heavy, complex

## Completed Work

### 2026-05-01
- Submitted PR: 12 unit tests for shell/utils/settings.ts (branch test-assist/settings-utils-tests)
- Coverage: 0% → 50% stmts, 33% fns, 92% branches
- Closed April 2026 Monthly Activity issue #17177; created May 2026 issue

### 2026-04-30
- Submitted PR #17431: 43 unit tests for shell/utils/pagination-utils.ts (branch test-assist/pagination-utils-tests)
- Coverage: 0% → 50% stmts, 44% fns, 77% branches

### 2026-04-30 (confirmed)
- PR #17412 (git.ts tests) merged by nwmac ✅

### 2026-04-29
- Created branch `test-assist/git-utils-tests` with 13 tests for shell/utils/git.ts
- PR #17412: 100% stmts/fns/lines coverage, 72% branches — all tests pass, ESLint clean

### 2026-04-22
- PR #17176 (url.ts, 38 tests) merged by nwmac ✅

### 2026-04-08
- Created PR #17176 (url.ts tests)

## Task Round-Robin History

- 2026-05-01: Task 3 (settings.ts 12 tests, 92% branches) + Task 4 (PR maintenance check) + Task 7 (monthly activity May)
- 2026-04-30: Task 3 (pagination-utils.ts 43 tests, 50% stmts) + Task 7 (monthly activity update)
- 2026-04-29: Task 3 (git.ts 13 tests, 100% stmts/fns/lines) + Task 7 (monthly activity update)

## Monthly Activity Issue

- Issue for May 2026: created 2026-05-01 (new)
- Issue #17177: closed 2026-05-01 (was April 2026)
- PR #17431: pagination-utils.ts — open
- PR for settings.ts: submitted 2026-05-01, number TBD (branch test-assist/settings-utils-tests)

## Maintainer Priorities

None noted yet.
