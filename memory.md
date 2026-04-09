# Test Improver Memory

## Commands (Validated)

- **Install**: `yarn install --ignore-engines`
- **Unit tests**: `NODE_OPTIONS=--max_old_space_size=8192 jest --silent <path>` or `yarn test:ci`
- **Lint**: `./node_modules/.bin/eslint --max-warnings 0 --ext .js,.ts,.vue .`
- **Coverage**: included in `yarn test:ci` via `--collectCoverage`
- **Test framework**: Jest + TypeScript (ts-jest)
- **Node**: v20 (engine requires >=24, use --ignore-engines)

## Testing Notes

- Tests go in `__tests__/` subdirectory, named `<file>.test.ts`
- Use `toStrictEqual` (not `toEqual`), `toHaveBeenCalledWith` (not `toHaveBeenCalled`)
- `it.each` for tabular test cases
- `shallowMount` preferred for component tests
- TypeScript required for new tests

## Testing Backlog (Prioritized)

1. `shell/utils/url.ts` - ✅ DONE (PR submitted Apr 2026)
2. `shell/utils/pagination-utils.ts` - ✅ DONE (PR submitted Apr 2026, 39 tests, pure functions)
3. `shell/utils/fleet.ts` (328 lines, partial?) - check if fleet.test.ts covers it
4. `shell/utils/async.ts` (34 lines) - simple, low priority
5. `shell/utils/gc/gc.ts` - garbage collection logic, no tests, complex
6. `shell/utils/dynamic-content/` - notification/announcement logic

## Completed Work

### 2026-04-09
- Created PR: test-assist/pagination-utils-tests branch
  - Added 39 tests for shell/utils/pagination-utils.ts pure functions
  - validateNsProjectFilter, validateNsProjectFilters, paginationFilterEqual, paginationFiltersEqual, paginationEqual, getStoreSettings
  - All tests pass, lint clean. Coverage: 49.67% lines, 80.55% branches

### 2026-04-08
- Created PR: test-assist/url-utils-tests branch
  - Added 38 tests for shell/utils/url.ts (addParam, addParams, removeParam, parseLinkHeader, portMatch, isMaybeSecure, parse, stringify)
  - All tests pass, no lint errors

## Task Round-Robin History

- 2026-04-09: Tasks 3 (implement tests for pagination-utils), 7 (monthly summary)
- 2026-04-08: Tasks 1 (discover commands), 2 (identify opportunities), 3 (implement tests), 7 (monthly summary)

## Maintainer Priorities

None noted yet.
