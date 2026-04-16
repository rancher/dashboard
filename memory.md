# Test Improver Memory

## Commands (Validated)

- **Install**: `yarn --ignore-engines install`
- **Unit tests (single file)**: `NODE_OPTIONS=--max_old_space_size=8192 node_modules/.bin/jest --no-coverage <path>`
- **Unit tests (all)**: `yarn --ignore-engines test:ci` (may fail due to engine check; prefer jest directly)
- **Lint single file**: `node_modules/.bin/eslint --max-warnings 0 <file>`
- **Coverage**: add `--collectCoverage --coverageDirectory /tmp/coverage --collectCoverageFrom <file>` to jest invocation
- **Test framework**: Jest + TypeScript (ts-jest)
- **Node**: v20 (engine requires >=24, use --ignore-engines or call jest directly)
- **IMPORTANT**: `yarn test:ci` fails with engine check; use `node_modules/.bin/jest` directly
- **IMPORTANT**: `node_modules/` does NOT exist on fresh clone; must run `yarn --ignore-engines install` first

## Testing Notes

- Tests go in `__tests__/` subdirectory, named `<file>.test.ts`
- Use `toStrictEqual` (not `toEqual`), `toHaveBeenCalledWith` (not `toHaveBeenCalled`)
- `it.each` for tabular test cases
- `shallowMount` preferred for component tests
- TypeScript required for new tests
- ESLint rule: describe block names must be lowercase (`jest/lowercase-name`)
- ESLint rule: `toThrow()` requires a message/constructor (`jest/require-to-throw-message`) — use `.toThrow(Error)`
- ESLint rule: key-spacing enforced in object literals
- ESLint rule: `object-curly-newline` — inline single-property objects when possible to avoid warnings
- Mock `Date.now` with `jest.spyOn(Date, 'now').mockReturnValue(timestamp)` for time-dependent tests
- `jest.restoreAllMocks()` in `afterEach` when using `spyOn`
- Math.floor on negative floats rounds toward -infinity (e.g. floor(-200.6) = -201)
- EXT.USER_ACTIVITY = 'ext.cattle.io.useractivity' (from shell/config/types.js)

## Testing Backlog (Prioritized)

1. `shell/utils/git.ts` - has testable normalize functions; tests attempted 2026-04-11 but NOT committed
2. `shell/utils/pagination-utils.ts` - started 2026-04-09; pagination-wrapper.test.ts exists but pagination-utils.test.ts not confirmed
3. `shell/utils/fleet.ts` (328 lines) - fleet.test.ts exists (155 lines) but partial coverage
4. `shell/utils/settings.ts` - getPerformanceSetting and isProviderEnabled are testable
5. `shell/utils/gc/gc.ts` - garbage collection logic, store-heavy, complex

## Completed Work

### 2026-04-16 (this run)
- Written 16 tests for shell/utils/inactivity.ts
- Coverage: 100% statements/functions/lines, 85.71% branches
- Committed to branch test-assist/inactivity-utils-tests (local only)
- BLOCKED: safeoutputs tools still not in tool list (6th consecutive run)
- PR not created; branch is local only

### 2026-04-15
- Written 15 tests for shell/utils/inactivity.ts (100% all metrics)
- BLOCKED: safeoutputs tools not in tool list (5th consecutive run); PR not created

### 2026-04-14
- Written 20 tests for shell/utils/inactivity.ts (100% all metrics)
- BLOCKED: safeoutputs tools not available (4th consecutive run); PR not created

### 2026-04-13
- Re-wrote 18 tests for shell/utils/inactivity.ts (100% stmts/fns/lines, 75% branches)
- BLOCKED: safeoutputs not available

### 2026-04-12
- Wrote 14 tests for shell/utils/inactivity.ts
- BLOCKED: safeoutputs not available

### 2026-04-11
- Wrote 11 tests for shell/utils/git.ts
- BLOCKED: safeoutputs unavailable

### 2026-04-09
- Wrote 39 tests for shell/utils/pagination-utils.ts
- NOT CONFIRMED pushed

### 2026-04-08
- Created PR #17176: url.ts tests (38 tests, still open)
- Created issue #17177: Monthly Activity 2026-04

## Task Round-Robin History

- 2026-04-16: Task 3 (inactivity.ts 16 tests) - BLOCKED on safeoutputs (6th consecutive)
- 2026-04-15: Task 3 (inactivity.ts 15 tests, 100% all coverage) - BLOCKED on safeoutputs (5th consecutive)
- 2026-04-14: Task 3 (inactivity.ts 20 tests, 100% all coverage) - BLOCKED on safeoutputs (4th consecutive)
- 2026-04-13: Task 3 (inactivity.ts 18 tests) - BLOCKED on safeoutputs
- 2026-04-12: Tasks 3 (inactivity.ts), 7 - BLOCKED on safeoutputs
- 2026-04-11: Tasks 3 (git.ts), 4 - BLOCKED on safeoutputs
- 2026-04-09: Tasks 3 (pagination-utils), 7
- 2026-04-08: Tasks 1, 2, 3 (url.ts), 7

## Pending (needs retry when safeoutputs available)

- inactivity.ts tests: ready as branch test-assist/inactivity-utils-tests (local only, recreated each run)
  - 16 tests, coverage: 100% statements/functions/lines, 85.71% branches
  - READY TO PUSH as PR (base: master, draft, label: testing)
  - PR title: "[Test Improver] test: add unit tests for shell/utils/inactivity.ts"
  - NOTE: branches are local only; each run must recreate the branch and re-commit
- git.ts tests: NOT pushed (safeoutputs unavailable 2026-04-11)
- Monthly activity issue #17177 last updated 2026-04-08 (needs update with PR info when PR is made)
- **safeoutputs tools have been unavailable for 6 consecutive runs** (2026-04-11 through 2026-04-16)

## Maintainer Priorities

None noted yet.

## Monthly Activity Issue

- Issue #17177: [Test Improver] Monthly Activity 2026-04 (open, last updated 2026-04-08)
- PR #17176: [Test Improver] url.ts tests (open, still pending review)
