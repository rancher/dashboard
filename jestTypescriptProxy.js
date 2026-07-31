/**
 * TypeScript, with the one call `@vue/vue3-jest` gets wrong repaired.
 *
 * When it downlevels the compiled `<template>` of a TypeScript SFC it builds the compiler
 * options it needs - notably `module: CommonJS` - and then passes them to the wrong key:
 *
 * ```js
 * // node_modules/@vue/vue3-jest/lib/process.js
 * const tsconfig = getTypeScriptConfig(...)      // -> { compilerOptions: { module: CommonJS } }
 * const { outputText } = transpileModule(result.code, { tsconfig })
 * ```
 *
 * `transpileModule` reads `compilerOptions`, not `tsconfig`, so the options are dropped and
 * TypeScript's defaults apply. Through TypeScript 5 those defaults emitted CommonJS, so the
 * bug was invisible. TypeScript 6 defaults to ESM, which breaks two things at once: Jest
 * cannot parse the module (`SyntaxError: Cannot use import statement outside a module`), and
 * `generate-code.js` attaches the render function by looking for the literal
 * `exports.render = render;`, so components that do load render nothing.
 *
 * TypeScript 6 exports are getter-only and non-configurable, so the function cannot be
 * replaced on the module. A Proxy can intercept it instead. Only `@vue/vue3-jest` is routed
 * here - see `vue3JestRegisterTs.js`.
 *
 * `@vue/vue3-jest` is capped at 29.2.6, the last release supporting Jest 29, so there is no
 * fixed version to move to. Remove this once it is fixed upstream.
 */
const typescript = require('typescript');

module.exports = new Proxy(typescript, {
  get(target, property, receiver) {
    if (property !== 'transpileModule') {
      return Reflect.get(target, property, receiver);
    }

    return function transpileModule(input, transpileOptions) {
      const misplaced = transpileOptions && transpileOptions.tsconfig;

      if (misplaced && misplaced.compilerOptions && !transpileOptions.compilerOptions) {
        return target.transpileModule(input, {
          ...transpileOptions,
          compilerOptions: {
            ...misplaced.compilerOptions,
            // The repo enables `sourceMap`, which makes this emit a trailing
            // `//# sourceMappingURL=` comment. `generate-code.js` appends the render
            // wiring straight onto the end of this output, so the wiring would land
            // inside that comment and never run - leaving components rendering nothing.
            sourceMap:       false,
            inlineSourceMap: false,
            inlineSources:   false,
            declaration:     false,
            declarationMap:  false,
          },
        });
      }

      return target.transpileModule(input, transpileOptions);
    };
  },
});
