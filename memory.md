# Test Improver Memory

## Commands (Validated)

- **Install**: `yarn --ignore-engines install --frozen-lockfile`
- **Unit tests (single file)**: `node_modules/.bin/jest --no-coverage <path>`
- **Lint single file**: `node_modules/.bin/eslint --max-warnings 0 <file>`
- **Coverage**: add `--collectCoverage --coverageDirectory /tmp/coverage --collectCoverageFrom <file>` to jest invocation
- **Test framework**: Jest + TypeScript (ts-jest)
- **IMPORTANT**: `yarn test:ci` fails with engine check; use `node_modules/.bin/jest` directly

## ESLint Rules to Watch

- describe/it names must be lowercase (`jest/lowercase-name`)
- `toThrow()` requires message (`jest/require-to-throw-message`)
- `promise/param-names` — use `resolve`/`reject`, not `r`/`rej`
- Use `eslint --fix` for key-spacing, object-curly-newline
- `jest/require-top-level-describe` — hooks must be inside describe
- `jest/no-conditional-expect` — no `if` around `expect()`

## Testing Notes

- validators mock: `{ 'i18n/t': (key, args) => args ? key+':'+JSON.stringify(args) : key, 'i18n/exists': () => false }`
- gc singletons: `jest.resetModules()` + `jest.mock('../gc')` in `beforeEach`
- gc-route-changed.ts bug: `match[2]` but regex only has 1 capture group
- parse-externalid.js: EXTERNAL_ID.KIND_CATALOG is undefined → kind=undefined (bug)
- duration.js: `toSeconds` uses Math.floor; sub-second inputs return 0
- platform.js: jsdom `navigator.platform=''` → isMac=false
- window.js: mock `window.screen` via Object.defineProperty; use jest.useFakeTimers() for Popup
- computed.js: `integerString`/`keyValueStrings` return `{get(),set()}`; test with `.call(ctx)`
- queue.js: compaction triggers at `++offset * 2 >= array.length`
- cspAdaptor.ts: call `CspAdapterUtils.resetState()` in beforeEach
- select.js: `!top` truthy for `undefined` AND `0`; mock `getBoundingClientRect` on real HTMLElement
- time.ts: `diffFrom` while-loop second condition unreachable; use fixed anchor date (no clock mock)
- crypto/browserHashUtils.js: `hashObj({})` → '31e'; `hashObj({a:1})` → '1b0fmfe'
- crypto/index.js: Buffer.from !== Uint8Array.from in Node.js 22; URL alphabet: 'a'→'YQ'
- validators/container-images.js: jobTemplate path `jobTemplate.spec.template.spec` vs `template.spec`
- validators/flow-output.js: verifyLocal mode checks both refs; global mode only globalOutputRefs
- validators/logging-outputs.js: logdna returns early for isEmpty(value); api_key must be non-empty
- validators/monitoring-route.js: interval regex `/^\d+[hms]$/`

## Testing Backlog (Prioritized)

1. `shell/utils/crypto/index.js` — `md5`, `sha256`, `hash` (require Md5/Sha256 browser class mocking; deferred)
2. `shell/utils/dynamic-content/notification-handler.ts` — store mock needed; async (medium)
3. `shell/utils/scroll.js` — trivial DOM utility (low priority)

## Completed Work (Summary)

- 2026-06-13: PR (branch test-assist/validator-tests-container-flow-logdna-monitoring): 38 tests for 4 validator files; 100% all metrics
- 2026-06-12: PR #18041: 35 tests for crypto/browserHashUtils.js + crypto/index.js
- 2026-06-11: PR #18033: 32 tests for time.ts — merged ✅
- 2026-06-10: PR #18023: 11 tests for select.js — merged ✅
- 2026-06-09: PR #18011: 14 tests for cspAdaptor.ts — merged ✅
- 2026-06-08: PR #17989: 16 tests for release-notes.ts — merged ✅
- 2026-06-07: PR #17987: 23 tests for queue.js — merged ✅
- 2026-06-06: PR #17983: 22 tests for computed.js — merged ✅
- 2026-06-05: PR #17975: 22 tests for platform.js + window.js — merged ✅
- Earlier: #17904 (dom/width/title), #17889 (position), #17862 (monitoring), #17843 (string), #17815 (versions), #17806 (gc-root-store), #17801 (gatekeeper), all merged ✅

## Task Round-Robin History

- 2026-06-13: Task 3 (validators: container-images/flow-output/logging-outputs/monitoring-route, 38 tests) + Task 7
- 2026-06-12: Task 3 (crypto, 35 tests) + Task 7
- 2026-06-11: Task 3 (time.ts, 32 tests) + Task 7
- 2026-06-10: Task 3 (select.js, 11 tests) + Task 7
- 2026-06-09: Task 3 (cspAdaptor.ts, 14 tests) + Task 7
- 2026-06-07: Task 3 (queue.js, 23 tests) + Task 7
- 2026-06-06: Task 3 (computed.js, 22 tests) + Task 7
- 2026-06-05: Task 3 (platform.js + window.js, 22 tests) + Task 7

## Monthly Activity Issue

- May 2026 issue: #17452 (closed)
- June 2026 issue: #17976 (open)

## Maintainer Priorities

No specific priorities communicated yet.
