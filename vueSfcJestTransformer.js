/**
 * Jest transformer for `.vue` single-file components that does NOT use the
 * TypeScript compiler JS API (absent from the native TypeScript 7 package).
 *
 * Unlike `@vue/vue3-jest`, which transpiles the `<script>` and `<template>` blocks
 * *separately* and string-concatenates the CommonJS results (fragile: it depends on
 * TS-style writable/assignment exports and forces `loose` module output, which in
 * turn breaks dynamic-`import()` interop), this assembles the SFC into a single ESM
 * module and transpiles it ONCE with Babel using the normal (spec) interop plus the
 * project's runtime Babel plugins.
 *
 * Type resolution for `defineProps<T>()` macros (incl. path-aliased imports) is
 * provided TypeScript-free via ./vueSfcTsResolverShim (registered on compiler-sfc).
 */
const fs = require('fs');
const {
  parse, compileScript, compileTemplate, compileStyle,
} = require('@vue/compiler-sfc');
const babel = require('@babel/core');
const tsResolverShim = require('./vueSfcTsResolverShim');

compilerSfcRegisterTS();

function compilerSfcRegisterTS() {
  // eslint-disable-next-line global-require
  require('@vue/compiler-sfc').registerTS(() => tsResolverShim);
}

const nodeFs = {
  fileExists: (file) => fs.existsSync(file),
  readFile:   (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : undefined),
  realpath:   (file) => {
 try {
 return fs.realpathSync(file);
} catch {
 return file;
}
},
};

// Stable, deterministic scope id from the file path (no Math.random - unavailable
// in some sandboxes and would break caching anyway).
const scopeIdFor = (filename) => {
  let hash = 0;

  for (let i = 0; i < filename.length; i++) {
    hash = (Math.imul(hash, 31) + filename.charCodeAt(i)) | 0;
  }

  return `data-v-${ (hash >>> 0).toString(16) }`;
};

module.exports = {
  process(src, filename) {
    const { descriptor } = parse(src, { filename });
    const id = scopeIdFor(filename);
    const parts = [];

    // --- <script> / <script setup> -> `const __sfc_main__ = ...` (no default export)
    let bindings;

    if (descriptor.script || descriptor.scriptSetup) {
      const compiled = compileScript(descriptor, {
        id,
        genDefaultAs:   '__sfc_main__',
        inlineTemplate: false,
        fs:             nodeFs,
      });

      bindings = compiled.bindings;
      parts.push(compiled.content);
    } else {
      parts.push('const __sfc_main__ = {};');
    }

    // --- <template> -> `export function render(...)`, then attach it to the component.
    // Scope ids for scoped styles are intentionally NOT applied: they add `data-v-*`
    // attributes that don't matter in jsdom (no CSS is applied) and would change
    // rendered-DOM snapshots vs the previous transformer.
    if (descriptor.template) {
      const template = compileTemplate({
        id,
        source:   descriptor.template.content,
        filename,
        compilerOptions: {
          bindingMetadata: bindings,
          mode:            'module',
        },
      });

      parts.push(template.code);
      parts.push('__sfc_main__.render = render;');
    }

    // --- <style module> -> expose the class-name map(s) as `$style` / named modules
    const cssModules = {};

    descriptor.styles.forEach((style, index) => {
      if (!style.module) {
        return;
      }
      const name = typeof style.module === 'string' ? style.module : '$style';
      const compiled = compileStyle({
        id, filename, source: style.content, scoped: style.scoped, modules: true,
      });

      cssModules[name] = compiled.modules || {};
    });

    if (Object.keys(cssModules).length) {
      parts.push(`__sfc_main__.__cssModules = ${ JSON.stringify(cssModules) };`);
    }

    parts.push('export default __sfc_main__;');

    // Transpile the assembled ESM module ONCE - single module => normal interop,
    // one `__esModule`, no cross-part concatenation hazards.
    const out = babel.transformSync(parts.join('\n'), {
      filename:   `${ filename }.ts`, // `.ts` so preset-typescript strips types (no JSX)
      configFile: false,
      babelrc:    false,
      // Tell the module transform that the runtime (Jest's CJS VM) has no static/
      // dynamic ESM, so `import()` is downleveled to a `require`-based form (native
      // `import()` throws "without --experimental-vm-modules" in Jest).
      caller:     {
 name: 'vue-sfc-jest', supportsStaticESM: false, supportsDynamicImport: false
},
      presets:    [['@babel/preset-typescript', { allowDeclareFields: true }]],
      plugins:    [
        // `transform-dynamic-import` + the module transform downlevel `import()` to a
        // `require`-based form Jest can run (with the `caller` above).
        '@babel/plugin-transform-dynamic-import',
        '@babel/plugin-transform-modules-commonjs',
        'transform-require-context',
        '@babel/plugin-transform-nullish-coalescing-operator',
      ],
      sourceMaps: 'inline',
    });

    return { code: out.code };
  },
};
