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

## Testing Backlog (Prioritized)

1. `shell/utils/pagination-utils.ts` (306 lines) — complex pagination logic, no tests
2. `shell/utils/fleet.ts` (328 lines) — fleet.test.ts exists but partial coverage
3. `shell/utils/settings.ts` - getPerformanceSetting and isProviderEnabled are testable
4. `shell/utils/gc/gc.ts` — garbage collection logic, store-heavy, complex

## Completed Work

### 2026-04-29
- Confirmed PR #17176 (url.ts) was merged on 2026-04-22 ✅
- Confirmed shell/utils/__tests__/inactivity.test.ts (22 tests) already in master ✅
- Created branch `test-assist/git-utils-tests` with 13 tests for shell/utils/git.ts
- 100% stmts/fns/lines coverage, 72% branches — all tests pass, ESLint clean
- Submitted PR via safeoutputs (branch: test-assist/git-utils-tests)
- Updated Monthly Activity issue #17177

### 2026-04-22
- PR #17176 (url.ts, 38 tests) merged by nwmac ✅

### 2026-04-08
- Created PR #17176 (url.ts tests), issue #17177 (Monthly Activity 2026-04)

## Task Round-Robin History

- 2026-04-29: Task 3 (git.ts 13 tests, 100% stmts/fns/lines) + Task 7 (monthly activity update)
- 2026-04-28 and earlier: see previous entries (inactivity.ts work, blocked on safeoutputs)

## Monthly Activity Issue

- Issue #17177: [Test Improver] Monthly Activity 2026-04 (open, updated 2026-04-29)
- PR #17176: merged 2026-04-22 ✅

## Maintainer Priorities

None noted yet.
