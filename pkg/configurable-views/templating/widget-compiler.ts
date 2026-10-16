// Compiles a widget Liz wrote - a Vue single-file component held in a ConfigMap - into a live component.
//
// With @vue/compiler-sfc, in the browser: the same compiler the Vue SFC Playground uses. It is large,
// so this module is only ever loaded through a dynamic import (see WidgetGenerated) - a chunk of its
// own, fetched when a generated widget is first shown.
//
// SECURITY: this runs code that came from a ConfigMap (`new Function`). It is only ever called for a
// widget an admin approved, with the exact source approved (see widgetApprovals). The code gets no
// module but `vue`: what it may use - Rancher's components, and a read-only `api` for the data - is
// handed to it (see WidgetGenerated), rather than anything it can import.

import * as Vue from 'vue';
import {
  parse, compileScript, compileTemplate, compileStyle, rewriteDefault
} from '@vue/compiler-sfc';

export interface CompiledWidget {
  component: Record<string, unknown>;
  /** Its style blocks, in the page's head - to remove when the widget goes. */
  styles: HTMLStyleElement[];
}

/** A stable id per source (djb2), so the same source keeps the same scoped-style selector. */
function hashId(str: string): string {
  let h = 5381;

  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }

  return h.toString(36);
}

/** "a as b, c" -> "a: b, c": an import's named list as a destructuring. */
const convertNamed = (named: string) => named.split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.replace(/\s+as\s+/, ': '))
  .join(', ');

/**
 * The compiled module as a function body: no `export`, and each `import … from 'vue'` as bindings to
 * the Vue it is given. Any other import is refused - a generated widget gets what it may use handed
 * to it, never a module it picks.
 */
function toRuntimeBody(code: string): string {
  const out = code.replace(/^[ \t]*export\s+(function\s+render\b)/m, '$1');

  return out
    .replace(/^[ \t]*import\s+([^;'"]+?)\s+from\s+['"]([^'"]+)['"];?[ \t]*$/gm, (_m, clause: string, spec: string) => {
      if (spec !== 'vue') {
        throw new Error(`"${ spec }" cannot be imported by a generated widget - use the components and the api it is given`);
      }

      const c = clause.trim();

      if (c.startsWith('* as ')) {
        return `const ${ c.slice(5).trim() } = Vue;`;
      }

      const brace = c.indexOf('{');

      if (brace === -1) {
        return `const ${ c } = Vue;`;
      }

      const def = c.slice(0, brace).replace(/,\s*$/, '').trim();
      const named = c.slice(brace + 1, c.lastIndexOf('}'));

      return `${ def ? `const ${ def } = Vue;\n` : '' }const { ${ convertNamed(named) } } = Vue;`;
    })
    .replace(/^[ \t]*import\s+['"][^'"]+['"];?[ \t]*$/gm, '');
}

/** Compile a widget's source into a component, its styles added to the page. */
export function compileWidget(source: string, filename = 'widget.vue'): CompiledWidget {
  const styles: HTMLStyleElement[] = [];
  const { descriptor, errors } = parse(source, { filename });

  if (errors.length) {
    throw new Error(errors.map((e) => (e as Error).message || String(e)).join('\n'));
  }

  const id = hashId(source);
  const scopeId = `data-v-${ id }`;
  const hasScoped = descriptor.styles.some((s) => s.scoped);
  const isSetup = !!descriptor.scriptSetup;

  // The script. <script setup> inlines its render, so it can see the setup's bindings.
  let scriptCode = 'const __sfc_main__ = {};';

  if (descriptor.script || descriptor.scriptSetup) {
    const compiled = compileScript(descriptor, {
      id,
      inlineTemplate:  isSetup,
      templateOptions: hasScoped ? { compilerOptions: { scopeId } } : {},
    });

    scriptCode = rewriteDefault(compiled.content, '__sfc_main__');
  }

  // The template, for an Options API component.
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
      throw new Error(tpl.errors.map((e) => (typeof e === 'string' ? e : e.message)).join('\n'));
    }

    renderCode = `${ tpl.code }\n__sfc_main__.render = render;`;
  }

  // The styles, as plain CSS (no preprocessor), scoped to the widget when asked.
  for (const block of descriptor.styles) {
    const compiled = compileStyle({
      source: block.content, filename, id: scopeId, scoped: block.scoped
    });
    const el = document.createElement('style');

    el.textContent = compiled.code;
    el.setAttribute('data-generated-widget', id);
    document.head.appendChild(el);
    styles.push(el);
  }

  const scopeCode = hasScoped ? `__sfc_main__.__scopeId = ${ JSON.stringify(scopeId) };` : '';

  try {
    const body = toRuntimeBody([scriptCode, renderCode, scopeCode, 'return __sfc_main__;'].join('\n'));

    // eslint-disable-next-line no-new-func
    const component = new Function('Vue', body)(Vue) as Record<string, unknown>;

    return { component, styles };
  } catch (e) {
    styles.forEach((el) => el.remove());
    throw e;
  }
}
