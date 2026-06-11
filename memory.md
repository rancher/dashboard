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
- string.js: escapeHtml regex `/[&<>"']/g` does NOT include `/`, so `/` is not escaped; escapeRegex escapes all `.*+?^${}()|[\]` chars; formatPercent: value<1 AND maxPrecision>=2 → 2 decimal places; value<10 AND maxPrecision>=1 → 1 decimal place; else round
- monitoring.js: hasEndpointSubsets returns `undefined` (not `false`) when endpoint not found or subsets undefined
- position.js: fitOnScreen uses `triggerElemOrEvent instanceof Event` — must pass real `new MouseEvent(...)` not plain object
- dom.js: getParent() traverses DOM upward; el.matchesSelector branch (line 8) not coverable in jsdom
- width.js: getWidth() uses `el.length` check; jsdom getComputedStyle returns '0px' for unstiled elements
- title.ts: updatePageTitle filters falsy values; empty string is falsy so it gets filtered out
- platform.js: jsdom gives `navigator.platform=''` → isMac=false; use exported `alternateKey`/`moreKey`/`rangeKey` constants for platform-agnostic tests
- window.js: mock `window.screen` via Object.defineProperty; spy on `window.open`; use jest.useFakeTimers() for Popup.open setInterval polling
- computed.js: `integerString` and `keyValueStrings` return `{get(),set()}` objects; test with `.call(ctx)` on plain object; no mocking needed; `Object.is(NaN,NaN)=true` so `toStrictEqual(NaN)` works
- queue.js: offset-based compaction triggers at `++offset * 2 >= array.length`; test with 4 items where 2nd dequeue triggers compaction; backing array reset preserves correctness
- cspAdaptor.ts: static class; call `CspAdapterUtils.resetState()` in `beforeEach`; hasCspAdapter uses `apps?.find()` (null-safe); fetchCspAdaptorApp: cache check, canList guard, paginationEnabled → findPage, else → findAll; mock getters as jest.fn().mockReturnValue(val)
- select.js: `calculatePosition` uses `Object.defineProperty` for `window.scrollY/innerHeight`, `document.body.offsetHeight`, `el.offsetHeight`; jsdom does NOT support `min-content` style value (silently ignored); `!top` is truthy for both `undefined` AND `0` (edge case when y=0, height=1, scrollY=0); mock `getBoundingClientRect` with `jest.fn()` on real HTMLElement
- time.ts: `diffFrom` while-loop `absDiff >= FACTORS[i] && i < FACTORS.length` — second operand is unreachable (FACTORS[i]=undefined → NaN comparison fails first); `safeSetTimeout` uses `jest.useFakeTimers()` in beforeEach + `jest.useRealTimers()` in afterEach for self-contained fake-timer tests; `diffFrom` tests use fixed `day('2024-01-01T12:00:00Z')` anchor — no clock mocking needed

## Testing Backlog (Prioritized)

1. `shell/utils/dynamic-content/util.ts` — `removeMatchingNotifications`, `createLogger` with store/localStorage/event mocks (medium priority)
2. `shell/utils/scroll.js` — trivial DOM utility (low priority)

## Completed Work (Summary)

- 2026-06-11: PR (branch test-assist/time-utils-tests): 32 tests for time.ts (elapsedTime, safeSetTimeout, getSecondsDiff, diffFrom); 100% stmts/fns/lines, 96% branches
- 2026-06-10: PR #18023 (branch test-assist/select-utils-tests): 11 tests for select.js calculatePosition; 100% all metrics — merged ✅
- 2026-06-09: PR #18011 (branch test-assist/csp-adaptor-tests): 14 tests for cspAdaptor.ts; 100% all metrics — merged ✅
- 2026-06-08: PR #17989 (branch test-assist/release-notes-tests): 16 tests for release-notes.ts — merged ✅
- 2026-06-07: PR #17987 (branch test-assist/queue-utils-tests): 23 tests for queue.js — merged ✅
- 2026-06-06: PR #17983 (branch test-assist/computed-utils-tests): 22 tests for computed.js — merged ✅
- 2026-06-05: PR #17975 (branch test-assist/platform-window-utils-tests): 22 tests for platform.js, window.js — merged ✅
- 2026-05-30: PR #17904 (branch test-assist/dom-width-title-tests): 26 tests for dom.js, width.js, title.ts — merged ✅
- 2026-05-29: PR #17889 (position.js, 21 tests) — merged ✅
- 2026-05-28: PR #17862 (monitoring.js, 14 tests) — merged ✅
- 2026-05-27: PR #17843 (string.js, 116 tests) — merged ✅
- 2026-05-25: PR #17815 (versions.ts, 10 tests) — merged ✅
- 2026-05-24: PR #17806 (gc-root-store.js, 15 tests) — merged ✅
- 2026-05-23: PR #17801 (gatekeeper/util.js, 14 tests) — merged ✅
- All earlier PRs #17692–#17904: merged or in review

## Task Round-Robin History

- 2026-06-11: Task 3 (time.ts, 32 tests) + Task 7
- 2026-06-10: Task 3 (select.js, 11 tests) + Task 7
- 2026-06-09: Task 3 (cspAdaptor.ts, 14 tests) + Task 7
- 2026-06-07: Task 3 (queue.js, 23 tests) + Task 7
- 2026-06-06: Task 3 (computed.js, 22 tests) + Task 7
- 2026-06-05: Task 3 (platform.js + window.js, 22 tests) + Task 7
- 2026-05-30: Task 3 (dom.js + width.js + title.ts, 26 tests) + Task 7
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

- May 2026 issue: #17452 (closed)
- June 2026 issue: #17976 (open)

## Maintainer Priorities

No specific priorities communicated yet.
