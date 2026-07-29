/**
 * Redirects `require('typescript')` to a JS-API TypeScript, for the few tools that
 * still need the compiler's JS API.
 *
 * This repo's `typescript` is the native TS 7 package, which ships no JS API, so any
 * consumer calling `ts.readConfigFile` / `ts.sys` / the parser throws. Those tools get
 * a JS-API TypeScript installed under the alias `typescript-for-eslint`
 * (npm:typescript@5.9.3) instead. Nothing here needs the native compiler.
 *
 * Used by:
 *   - ESLint (`lint` / `lint:lib`), preloaded via `node -r`. `@typescript-eslint`
 *     bare-`require('typescript')`s and uses the compiler JS API; no release supports
 *     TS 7 (peer is `<6.1.0`) and the parser can't be shimmed.
 *   - Cypress (`cy:*` / `scripts/e2e`), preloaded via `NODE_OPTIONS` so it reaches the
 *     forked child that loads `cypress.config.ts`. Cypress transpiles the TS config with
 *     its bundled `ts-node`, which needs the JS API; without it, `ts-node` fails and Node
 *     loads the config natively as ESM, where extensionless relative imports don't resolve
 *     (`ERR_MODULE_NOT_FOUND` for `./cypress/base-config`).
 */
const Module = require('module');

const ALIAS = 'typescript-for-eslint';
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(request, ...rest) {
  if (request === 'typescript' || request.startsWith('typescript/')) {
    // eslint-disable-next-line no-param-reassign
    request = ALIAS + request.slice('typescript'.length);
  }

  return originalResolveFilename.call(this, request, ...rest);
};
