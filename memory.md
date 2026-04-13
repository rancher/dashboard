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

## Testing Notes

- Tests go in `__tests__/` subdirectory, named `<file>.test.ts`
- Use `toStrictEqual` (not `toEqual`), `toHaveBeenCalledWith` (not `toHaveBeenCalled`)
- `it.each` for tabular test cases
- `shallowMount` preferred for component tests
- TypeScript required for new tests
- ESLint rule: describe block names must be lowercase (`jest/lowercase-name`)
- Mock `Date.now` with `jest.spyOn(Date, 'now').mockReturnValue(timestamp)` for time-dependent tests

## Testing Backlog (Prioritized)

1. `shell/utils/inactivity.ts` - DONE locally (branch: test-assist/inactivity-utils-tests, 18 tests, 100% stmt/fn/line, 75% branch) - NOT pushed (safeoutputs unavailable 2026-04-12 and 2026-04-13). READY TO PUSH next run.
2. `shell/utils/url.ts` - DONE (PR #17176 open)
3. `shell/utils/git.ts` - has testable normalize functions; NOT pushed (safeoutputs unavailable)
4. `shell/utils/pagination-utils.ts` - started 2026-04-09 but NOT confirmed pushed; not in __tests__ dir
5. `shell/utils/fleet.ts` (328 lines) - fleet.test.ts exists (155 lines) but partial coverage
6. `shell/utils/settings.ts` - getPerformanceSetting and isProviderEnabled are testable
7. `shell/utils/gc/gc.ts` - garbage collection logic, store-heavy, complex

## Completed Work

### 2026-04-13
- Re-wrote 18 tests for shell/utils/inactivity.ts (100% statements/functions/lines, 75% branches)
- Tests: parseTTLData (9 cases), getUserActivity (4), updateUserActivity (3), token lifecycle (2)
- Lint clean, all 18 tests pass
- BLOCKED: safeoutputs tools not available; PR not created; code committed locally only
- Branch test-assist/inactivity-utils-tests ready to push in future run

### 2026-04-12
- Wrote 14 tests for shell/utils/inactivity.ts (parseTTLData: cap logic, 20% calc, 3s buffer; session token lifecycle; edge cases)
- All tests pass, lint clean. Coverage: 65% lines, 75% branches, 60% functions
- BLOCKED: safeoutputs tools not available; PR not created; branch test-assist/inactivity-utils-tests is local only

### 2026-04-11
- Wrote 11 tests for shell/utils/git.ts
- BLOCKED: safeoutputs tools unavailable; PR not created

### 2026-04-09
- Wrote 39 tests for shell/utils/pagination-utils.ts
- NOT CONFIRMED pushed

### 2026-04-08
- Created PR #17176: url.ts tests (38 tests, still open)
- Created issue #17177: Monthly Activity 2026-04

## Task Round-Robin History

- 2026-04-13: Task 3 (inactivity.ts 18 tests, 100% coverage) - BLOCKED on safeoutputs
- 2026-04-12: Tasks 3 (inactivity.ts), 7 (monthly summary) - BLOCKED on safeoutputs
- 2026-04-11: Tasks 3 (git.ts), 4 (maintain PRs) - BLOCKED on safeoutputs
- 2026-04-09: Tasks 3 (pagination-utils), 7 (monthly summary)
- 2026-04-08: Tasks 1, 2, 3 (url.ts), 7 (monthly summary)

## Pending (needs retry)

- inactivity.ts tests: committed locally as test-assist/inactivity-utils-tests, 18 tests, READY TO PUSH
- git.ts tests: NOT pushed (safeoutputs unavailable)
- Monthly activity issue #17177 not updated since 2026-04-09
- Verify if pagination-utils PR was ever created
- safeoutputs tools have been unavailable for 3 consecutive runs (2026-04-11, 2026-04-12, 2026-04-13)

## Maintainer Priorities

None noted yet.

## Monthly Activity Issue

- Issue #17177: [Test Improver] Monthly Activity 2026-04 (open)
