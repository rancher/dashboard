/**
 * Preloaded via `node -r` before ESLint (see the `lint` / `lint:lib` scripts).
 *
 * `@typescript-eslint` bare-`require('typescript')`s and uses the TypeScript compiler
 * JS API (parser, `ts.Extension`, ...). This repo's `typescript` is the native TS 7
 * package, which ships no JS API, so ESLint would crash. There is no `@typescript-eslint`
 * release that supports TS 7 (peer is `<6.1.0`), and the parser can't be shimmed.
 *
 * So for the lint process only, we redirect `require('typescript')` to a JS-API
 * TypeScript installed under the alias `typescript-for-eslint` (npm:typescript@5.9.3).
 * Nothing else in lint needs the native compiler, and no other process is affected.
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
