/**
 * Jest transformer for `.vue` files.
 *
 * Wraps `@vue/vue3-jest` so that `@vue/compiler-sfc` is given a TypeScript instance before it runs.
 * Without this, compiling any single-file component that resolves an *imported* type - e.g.
 * `defineProps<SomeImportedProps>()`, which several `@rancher/shell` components use - fails with:
 *
 * ```
 * [@vue/compiler-sfc] No fs option provided to `compileScript` in non-Node environment.
 * File system access is required for resolving imported types.
 * ```
 *
 * TypeScript does not populate `ts.sys` when loaded inside Jest, so compiler-sfc believes it has no
 * file system access. Registering TS explicitly restores it.
 *
 * SEE: https://github.com/vuejs/core/issues/8301
 */
require('@vue/compiler-sfc').registerTS(() => require('typescript'));

module.exports = require('@vue/vue3-jest');
