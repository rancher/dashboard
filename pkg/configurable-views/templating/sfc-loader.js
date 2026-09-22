// Runtime .vue compiler for code-kind custom views.
//
// Compiles SFC source (from a ConfigMap) in-browser into a live Vue component using
// @vue/compiler-sfc DIRECTLY (the same compiler the Vue SFC Playground / @vue/repl use).
// This replaces the previous vue3-sfc-loader wrapper: one fewer dependency, better error
// messages, and full control over how the compiled module is evaluated.
//
// Webpack resolves @vue/compiler-sfc's `import`/`module` condition to its self-contained
// browser build (dist/compiler-sfc.esm-browser.js). It is large (~1.7MB), so this file is
// only ever loaded via a dynamic import() from TemplateCode.vue — its own async chunk,
// never in the main bundle and only when a code view is actually opened.
//
// The compiled component is mounted inside the app tree, so it inherits app globals —
// `this.$store`, `this.$route`, etc. — and can import any @shell / @components component
// via the component registry.
//
// SECURITY: this executes arbitrary code (via `new Function`). It is a dev/experimental
// capability and must stay behind a flag; never a shipping default. Requires CSP
// `unsafe-eval`.

import * as Vue from 'vue';
import {
  parse, compileScript, compileTemplate, compileStyle, rewriteDefault
} from '@vue/compiler-sfc';
import { hasComponent, resolveComponent } from './component-registry';

// Stable per-source scope id (djb2). Same source -> same id, so recompiling identical
// source reuses the same scoped-style selector.
function hashId(str) {
  let h = 5381;

  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }

  return h.toString(36);
}

// ES-module default interop for a resolved component namespace.
function interopDefault(mod) {
  if (mod && (mod.__esModule || Object.prototype.hasOwnProperty.call(mod, 'default'))) {
    return mod.default;
  }

  return mod;
}

// Resolve a bare import specifier to a component module namespace, or throw (matching the
// old loader's error) so an unavailable import surfaces clearly on the page.
function requireModule(spec) {
  if (!hasComponent(spec)) {
    throw new Error(`import "${ spec }" is not available to custom views`);
  }

  return resolveComponent(spec);
}

// "a as b, c" -> "a: b, c" (import named list -> destructuring)
function convertNamed(named) {
  return named
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\s+as\s+/, ': '))
    .join(', ');
}

// Rewrite one ESM import statement into `const` bindings that pull from `Vue` (for the
// 'vue' specifier) or from `__req(spec)` (for component specifiers). Supports:
//   import * as NS from 's'      import Def from 's'
//   import Def, { a as b } from 's'    import { a, b as c } from 's'
function convertImport(clause, spec, nextTmp) {
  clause = clause.trim();
  const isVue = spec === 'vue';
  let def = null;
  let ns = null;
  let named = null;

  if (clause.startsWith('* as ')) {
    ns = clause.slice(5).trim();
  } else {
    const brace = clause.indexOf('{');

    if (brace === -1) {
      def = clause;
    } else {
      const before = clause.slice(0, brace).replace(/,\s*$/, '').trim();

      if (before) {
        def = before;
      }
      named = clause.slice(brace + 1, clause.lastIndexOf('}')).trim();
    }
  }

  const out = [];

  if (isVue) {
    // Vue is already a namespace object (import * as Vue).
    if (ns) {
      out.push(`const ${ ns } = Vue;`);
    }
    if (def) {
      out.push(`const ${ def } = Vue;`);
    }
    if (named !== null) {
      out.push(`const { ${ convertNamed(named) } } = Vue;`);
    }
  } else {
    const tmp = `__m${ nextTmp() }`;

    out.push(`const ${ tmp } = __req(${ JSON.stringify(spec) });`);
    if (ns) {
      out.push(`const ${ ns } = ${ tmp };`);
    }
    if (def) {
      out.push(`const ${ def } = __d(${ tmp });`);
    }
    if (named !== null) {
      out.push(`const { ${ convertNamed(named) } } = ${ tmp };`);
    }
  }

  return out.join('\n');
}

// Turn the assembled ESM module source into a plain function body: strip `export` and
// convert every `import ... from '...'` into in-scope const bindings.
function toRuntimeBody(code) {
  let tmp = 0;

  // `export function render` -> `function render` (the only remaining export after
  // rewriteDefault handled the script's `export default`).
  code = code.replace(/^[ \t]*export\s+(function\s+render\b)/m, '$1');

  // named/default/namespace imports (have a `from`)
  code = code.replace(
    /^[ \t]*import\s+([^;'"]+?)\s+from\s+['"]([^'"]+)['"];?[ \t]*$/gm,
    (_m, clause, spec) => convertImport(clause, spec, () => tmp++)
  );

  // side-effect imports (`import 'x'`) — none expected; drop them.
  code = code.replace(/^[ \t]*import\s+['"][^'"]+['"];?[ \t]*$/gm, '');

  return code;
}

/**
 * Compile SFC source into a component.
 * @param {string} source   the .vue source
 * @returns {{ component: object, styles: HTMLStyleElement[] }}
 */
export async function compileSFC(source, { filename = 'view.vue' } = {}) {
  const styles = [];
  const { descriptor, errors } = parse(source, { filename });

  if (errors.length) {
    throw new Error(errors.map((e) => e.message || String(e)).join('\n'));
  }

  const id = hashId(source);
  const scopeId = `data-v-${ id }`;
  const hasScoped = descriptor.styles.some((s) => s.scoped);
  const isSetup = !!descriptor.scriptSetup;

  // ---- SCRIPT ----
  let scriptCode = 'const __sfc_main__ = {};';

  if (descriptor.script || descriptor.scriptSetup) {
    // For <script setup> the render must be inlined so it can see setup bindings; for the
    // (normal) Options API case we compile the template separately, below.
    const compiled = compileScript(descriptor, {
      id,
      inlineTemplate:  isSetup,
      templateOptions: hasScoped ? { compilerOptions: { scopeId } } : {},
    });

    scriptCode = rewriteDefault(compiled.content, '__sfc_main__');
  }

  // ---- TEMPLATE (Options API path only; <script setup> inlines its own render) ----
  let renderCode = '';

  if (descriptor.template && !isSetup) {
    const tpl = compileTemplate({
      source:          descriptor.template.content,
      filename,
      id,
      scoped:          hasScoped,
      slotted:         descriptor.slotted,
      compilerOptions: hasScoped ? { scopeId } : {},
    });

    if (tpl.errors.length) {
      throw new Error(tpl.errors.map((e) => (e.message || String(e))).join('\n'));
    }

    renderCode = `${ tpl.code }\n__sfc_main__.render = render;`;
  }

  // ---- STYLES ---- (no preprocessor: scss/sass/less are treated as plain CSS, matching
  // the documented "no lang=scss" contract). Injected into <head>; returned for cleanup.
  descriptor.styles.forEach((styleBlock) => {
    const compiledStyle = compileStyle({
      source: styleBlock.content,
      filename,
      id:     scopeId,
      scoped: styleBlock.scoped,
    });

    if (compiledStyle.errors?.length) {
      // eslint-disable-next-line no-console
      console.warn('[custom-view sfc] style error', compiledStyle.errors);
    }

    const el = document.createElement('style');

    el.textContent = compiledStyle.code;
    el.setAttribute('data-custom-view', 'true');
    document.head.appendChild(el);
    styles.push(el);
  });

  // ---- ASSEMBLE + EVALUATE ----
  const scopeCode = hasScoped ? `__sfc_main__.__scopeId = ${ JSON.stringify(scopeId) };` : '';
  const assembled = [scriptCode, renderCode, scopeCode, 'return __sfc_main__;'].join('\n');
  const body = toRuntimeBody(assembled);

  // eslint-disable-next-line no-new-func
  const factory = new Function('Vue', '__req', '__d', body);
  const component = factory(Vue, requireModule, interopDefault);

  return { component, styles };
}
