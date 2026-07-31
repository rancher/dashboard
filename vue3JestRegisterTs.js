/**
 * Unit tests are failing with the following error:
 *
 * ```
 *     [@vue/compiler-sfc] No fs option provided to `compileScript` in non-Node environment. File system access is required for resolving imported types.
 * ```
 *
 * It seems TypeScript does not populate ts.sys when loaded in Jest. In order to
 * resolve this issue, we can use the hack below to point to a different
 * transformer than vue-jest and call registerTs before exporting vue-jest.
 *
 * SEE: https://github.com/vuejs/core/issues/8301
 */
require('@vue/compiler-sfc').registerTS(() => require('typescript'));

/**
 * Hand `@vue/vue3-jest` a corrected TypeScript, so that the compiled `<template>` of a
 * TypeScript SFC is emitted as CommonJS rather than ESM. See `jestTypescriptProxy.js` for
 * what is wrong and why it only surfaced with TypeScript 6.
 *
 * The redirect is scoped to `@vue/vue3-jest`: everything else in the Jest process keeps the
 * real `typescript`.
 */
const Module = require('module');
const path = require('path');

const proxyPath = require.resolve('./jestTypescriptProxy');
const vueJestDir = path.dirname(require.resolve('@vue/vue3-jest/package.json'));
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(request, parent, ...rest) {
  if (request === 'typescript' && parent && parent.filename && parent.filename.startsWith(vueJestDir)) {
    return proxyPath;
  }

  return originalResolveFilename.call(this, request, parent, ...rest);
};

module.exports = require('@vue/vue3-jest');
