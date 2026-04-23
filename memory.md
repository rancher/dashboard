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
- ESLint rule: key-spacing enforced in object literals
- ESLint rule: `object-curly-newline` — inline single-property objects; use `eslint --fix` to auto-fix
- ESLint rule: `jest/prefer-called-with` — use `toHaveBeenCalledWith(...)` not `toHaveBeenCalled()`
- ESLint rule: `padding-line-between-statements` — use `eslint --fix` to auto-fix spacing
- Mock `Date.now` with `jest.spyOn(Date, 'now').mockReturnValue(timestamp)` for time-dependent tests
- `jest.restoreAllMocks()` in `afterEach` (or `beforeEach`) when using `spyOn`
- Math.floor on negative floats rounds toward -infinity (e.g. floor(-200.6) = -201)
- EXT.USER_ACTIVITY = 'ext.cattle.io.useractivity' (from shell/config/types.js)
- For async util tests: mock store.dispatch, mock resource.save; always run `eslint --fix` before linting check
- inactivity.ts: Inactivity class exported as named export; use named export (not default singleton) in tests

## Testing Backlog (Prioritized)

1. `shell/utils/inactivity.ts` - READY FOR PR (tests written, 17 tests pass, ESLint clean)
   - Coverage: 100% stmts/fns/lines, 75% branches
   - branch: test-assist/inactivity-utils-tests (local only - recreated each run)
   - PR title: "[Test Improver] test: add unit tests for shell/utils/inactivity.ts"
2. `shell/utils/git.ts` - has testable normalize functions; tests attempted 2026-04-11 but NOT committed
3. `shell/utils/pagination-utils.ts` - started 2026-04-09; pagination-wrapper.test.ts exists but pagination-utils.test.ts not confirmed
4. `shell/utils/fleet.ts` (328 lines) - fleet.test.ts exists (155 lines) but partial coverage
5. `shell/utils/settings.ts` - getPerformanceSetting and isProviderEnabled are testable
6. `shell/utils/gc/gc.ts` - garbage collection logic, store-heavy, complex

## Completed Work

### 2026-04-23 (this run)
- Recreated 17 tests for shell/utils/inactivity.ts (100% stmts/fns/lines, 75% branches)
- All 17 tests pass, ESLint clean
- Committed to local branch `test-assist/inactivity-utils-tests` (commit 1a6ec0f)
- BLOCKED: safeoutputs tools still not in tool list (12th consecutive run)
- PR not created; branch is local only

### 2026-04-21
- Written 21 tests for shell/utils/inactivity.ts (100% stmts/fns/lines, 85.71% branches)
- BLOCKED: safeoutputs tools still not in tool list (11th consecutive run)

### 2026-04-20
- Written 18 tests for shell/utils/inactivity.ts
- BLOCKED: safeoutputs tools still not in tool list

### Previous runs (2026-04-11 through 2026-04-19)
- Repeatedly wrote inactivity.ts tests, blocked on safeoutputs

### 2026-04-09
- Wrote 39 tests for shell/utils/pagination-utils.ts
- NOT CONFIRMED pushed

### 2026-04-08
- Created PR #17176: url.ts tests (38 tests, still open per memory)
- Created issue #17177: Monthly Activity 2026-04

## Task Round-Robin History

- 2026-04-23: Task 3 (inactivity.ts 17 tests, 100% stmts/fns/lines) - BLOCKED on safeoutputs (12th consecutive)
- 2026-04-21: Task 3 (inactivity.ts 21 tests, 100% stmts/fns/lines) - BLOCKED on safeoutputs (11th consecutive)
- 2026-04-20: Task 3 (inactivity.ts 18 tests) - BLOCKED on safeoutputs (10th consecutive)
- 2026-04-19: Task 3 (inactivity.ts 15 tests) - BLOCKED on safeoutputs (9th consecutive)
- 2026-04-18: Task 3 (inactivity.ts 16 tests) - BLOCKED on safeoutputs (8th consecutive)
- 2026-04-17: Task 3 (inactivity.ts 20 tests) - BLOCKED on safeoutputs (7th consecutive)
- 2026-04-16: Task 3 (inactivity.ts 16 tests) - BLOCKED on safeoutputs (6th consecutive)
- 2026-04-15: Task 3 (inactivity.ts 15 tests) - BLOCKED on safeoutputs (5th consecutive)
- 2026-04-14: Task 3 (inactivity.ts 20 tests) - BLOCKED on safeoutputs (4th consecutive)
- 2026-04-13: Task 3 (inactivity.ts 18 tests) - BLOCKED on safeoutputs
- 2026-04-12: Tasks 3 (inactivity.ts), 7 - BLOCKED on safeoutputs
- 2026-04-11: Tasks 3 (git.ts), 4 - BLOCKED on safeoutputs
- 2026-04-09: Tasks 3 (pagination-utils), 7
- 2026-04-08: Tasks 1, 2, 3 (url.ts), 7

## Pending (needs retry when safeoutputs available)

- inactivity.ts tests: READY for PR (branch must be recreated each run - branches are local only)
  - 17 tests, coverage: 100% statements/functions/lines, 75% branches
  - All tests pass, ESLint clean
  - PR title: "[Test Improver] test: add unit tests for shell/utils/inactivity.ts"
  - Base branch: master, draft: true, labels: ["testing", "bot/test-improver"]
  - Test file: shell/utils/__tests__/inactivity.test.ts
- git.ts tests: NOT pushed (safeoutputs unavailable 2026-04-11)
- Monthly activity issue #17177 last updated 2026-04-08 (needs update with PR info when PR is made)
- **safeoutputs tools have been unavailable for 12 consecutive runs** (2026-04-11 through 2026-04-23)

## Maintainer Priorities

None noted yet.

## Monthly Activity Issue

- Issue #17177: [Test Improver] Monthly Activity 2026-04 (open, last updated 2026-04-08)
- PR #17176: [Test Improver] url.ts tests (open, still pending review per memory)
