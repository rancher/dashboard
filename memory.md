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

## Testing Backlog (Prioritized)

1. `shell/utils/fleet.ts` store-dependent methods — detailLocation, getResourcesDefaultState, getBundlesDefaultState
2. `shell/utils/pagination-utils.ts` store methods — isEnabled, isSteveCacheEnabled (need Vuex mock)
3. `shell/utils/gc/gc-root-store.js` — gc store integration
4. `shell/utils/ingress.ts` — fetchServices/fetchSecrets store-dependent methods
5. `shell/utils/alertmanagerconfig.js` — async store-dependent fns (follow-up with Vuex mock)
6. `shell/utils/svg-filter.js` — pure color filter algorithm (302 lines, no deps)

## Completed Work (Summary)

- 2026-05-18: PR (branch test-assist/alertmanagerconfig-tests): 12 tests for alertmanagerconfig.js pure fns; 85.7% branches
- 2026-05-17: PR #17699 (branch test-assist/aws-kube-utils-tests): 29 tests for aws.ts + kube.js; 100% all metrics
- 2026-05-16: PR #17692 (branch test-assist/namespace-filter-async-tests): 20 tests for namespace-filter.js + async.ts
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
- All PRs #17431–#17590: merged ✅

## Task Round-Robin History

- 2026-05-18: Task 3 (alertmanagerconfig.js, 12 tests) + Task 7
- 2026-05-17: Task 3 (aws.ts + kube.js, 29 tests) + Task 4 + Task 7
- 2026-05-16: Task 3 (namespace-filter.js + async.ts, 20 tests) + Task 7
- 2026-05-15: Task 3 (role-template.js + cron-schedule.js, 19 tests) + Task 7

## Monthly Activity Issue

- May 2026 issue: #17452 (open)
- Open PRs: #17692, #17699; branch test-assist/alertmanagerconfig-tests (new)

## Maintainer Priorities

No specific priorities communicated yet.
