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
- For async util `_status` errors: use `Object.assign(new Error('msg'), { _status: code })`
- gc singletons: use `jest.resetModules()` + `jest.mock('../gc')` in `beforeEach` for isolation
- gc-route-changed.ts has a bug: `getResourceFromRoute` uses `match[2]` but regex only has 1 capture group
- parse-externalid.js: EXTERNAL_ID.KIND_CATALOG is undefined → old-style parse returns kind=undefined (bug)
- parse-externalid.js: parseHelmExternalId expects format `kind:///key=val&key=val` (3 slashes, no ?)
- duration.js: `toMilliseconds('0')` returns 0; `toSeconds` uses Math.floor so sub-second inputs return 0
- units.js: `parseSi('1m', {allowFractional:false})` returns 1_000_000 (Mega not milli)
- promise.js: eachLimit debug param logs to console but not tested; real setTimeout needed for concurrency test
- perf-setting.utils.ts: isEnabled = `!paginationEnabled && perfSettings[this.setting].enabled`
- ingress.ts: findAndMapCerts/findAndMapServiceTargets are pure; fetchServices/fetchSecrets need Vuex mock
- pagination-utils.ts: pure methods need no mocks; store-dependent methods need Vuex mock
- settings.ts: `isProviderEnabled` takes `ClusterProvisionerContext` from `@shell/core/types`
- color.js: `contrastColor` default opts = LIGHT_CONTRAST_COLORS; both light and dark themes may return same value for mid-range colors; `lighten()` is private/not exported
- service.js: servicePort/externalName name-error merging has dead else branch (inner guard redundant); clusterIp is mostly a stub
- kubernetes-name.js: uncovered branch is invalidChars opt-out path inside validateChars internals
- cluster-name.js: uncovered branch is the regex `(c-.{5}|local)` non-match on short `c-abc` path
- pod-affinity.js: topologyKey regex is not anchored; only fails for strings with NO alphanumeric chars (e.g. `!!!`)
- prometheusrule.js: uncovered branch is `else if (has(rule, 'record') && isEmpty(rule.record))` path
- role-template.js: `missingOneResource` fires whenever both resources AND nonResourceURLs are empty (including undefined); use nonResourceURLs: ['/healthz'] in rules to avoid triggering it when testing other branches
- cron-schedule.js: mock cronstrue with `jest.mock('cronstrue', ...)` before imports; test validates error-to-i18n translation, not cron parsing
- async.ts: `waitFor` uses `this` in resolve (undefined in strict), but tests pass; gatedLog branches only active when log=true (not worth testing)
- aws.ts: all 4 functions are pure; Ipv6CidrBlockAssociationSet is array (check length); Tags.find for 'Name' key
- kube.js: normalizeName handles null/undefined via `(str || '')` pattern

## Testing Backlog (Prioritized)

1. `shell/utils/fleet.ts` store-dependent methods — detailLocation, getResourcesDefaultState, getBundlesDefaultState
2. `shell/utils/pagination-utils.ts` store methods — isEnabled, isSteveCacheEnabled (need Vuex mock)
3. `shell/utils/gc/gc-root-store.js` — gc store integration
4. `shell/utils/ingress.ts` — fetchServices/fetchSecrets store-dependent methods
5. `shell/utils/alertmanagerconfig.js` — pure functions: createDefaultRouteName, areRoutesSupportedFormat, canCreate
6. `shell/utils/svg-filter.js` — pure color filter algorithm (302 lines, no deps)

## Completed Work (Summary)

- 2026-05-17: PR (branch test-assist/aws-kube-utils-tests): 29 tests for aws.ts + kube.js; 100% all metrics
- 2026-05-16: PR #17692 (branch test-assist/namespace-filter-async-tests): 20 tests for namespace-filter.js + async.ts; namespace-filter 100%, async.ts 94% stmts/87% branches/100% fns
- 2026-05-15: PR (branch test-assist/validator-role-template-cron-tests): 19 tests for role-template.js + cron-schedule.js; 100% all metrics
- 2026-05-14: PR (branch test-assist/validator-tests-batch2): 79 tests for pod-affinity.js, prometheusrule.js, container-images.js, flow-output.js, logging-outputs.js, monitoring-route.js; 100% stmts/fns/lines, 98.7% branches
- 2026-05-13: PR (branch test-assist/kubernetes-cluster-name-tests): 37 tests for kubernetes-name.js + cluster-name.js; 100% stmts/fns/lines, 92.85% branches
- 2026-05-12: PR (branch test-assist/validators-service-tests): 30 tests for service.js; 97.05% stmts, 93.75% branches, 100% fns
- 2026-05-11: PR (branch test-assist/color-utils-tests): 32 tests for color.js; 100% stmts/fns/lines, 96.87% branches
- 2026-05-10: PR #17590 (branch test-assist/promise-queue-utils-tests): 34 tests for promise.js + queue.js; ~93% stmts, 100% fns
- 2026-05-09: PR #17583: 56 tests for validators/index.js; 100% stmts/fns/lines, 97.59% branches
- 2026-05-08: PR #17562: 39 tests for duration.js + parse-externalid.js; 100% + 97.84% stmts
- 2026-05-07: PR #17545: 57 tests for units.js; 90.15% stmts
- 2026-05-06: PR #17518: 21 tests for perf-setting.utils.ts + ingress.ts pure methods
- 2026-05-05: PR #17499: 43 tests for style.ts; 100% all metrics
- 2026-05-04: PR #17478: 16 tests for gc-interval.ts + gc-route-changed.ts
- 2026-05-03: PR #17471: 30 tests for gc.ts
- 2026-05-02: PR #17466: 40 tests for fleet.ts
- 2026-05-01: PR #17451: 12 tests for settings.ts; closed #17177, created May issue #17452
- All PRs #17431–#17590: merged by marcelofukumoto/nwmac ✅

## Task Round-Robin History

- 2026-05-17: Task 3 (aws.ts + kube.js, 29 tests) + Task 4 (checked PR #17692 CI - unit tests pass) + Task 7
- 2026-05-16: Task 3 (namespace-filter.js + async.ts, 20 tests) + Task 7
- 2026-05-15: Task 3 (role-template.js + cron-schedule.js, 19 tests) + Task 7
- 2026-05-14: Task 3 (validator-tests-batch2, 79 tests) + Task 7
- 2026-05-13: Task 3 (kubernetes-name.js + cluster-name.js, 37 tests) + Task 7
- 2026-05-12: Task 3 (service.js, 30 tests) + Task 4 (all PRs merged) + Task 7
- 2026-05-11: Task 3 (color.js, 32 tests) + Task 4 (reviewed open PRs, no failures) + Task 7
- 2026-05-10: Task 2 (scanned untested utils) + Task 3 (promise.js+queue.js, 34 tests) + Task 7
- 2026-05-09: Task 3 (validators/index.js, 56 tests) + Task 4 + Task 7
- 2026-05-08: Task 3 (duration.js+parse-externalid.js, 39 tests) + Task 4 + Task 7
- 2026-05-07: Task 3 (units.js, 57 tests) + Task 4 + Task 7
- 2026-05-06: Task 3 (perf-setting+ingress, 21 tests) + Task 4 + Task 7

## Monthly Activity Issue

- May 2026 issue: #17452 (open)
- Open PRs: #17692 (namespace-filter+async); test-assist/aws-kube-utils-tests (new, pending PR number)
- Open branches without PR numbers: test-assist/validator-role-template-cron-tests, test-assist/validator-tests-batch2, test-assist/kubernetes-cluster-name-tests, test-assist/validators-service-tests, test-assist/color-utils-tests

## Maintainer Priorities

No specific priorities communicated yet.
