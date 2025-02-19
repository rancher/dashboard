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
module.exports = require('@vue/vue3-jest');
