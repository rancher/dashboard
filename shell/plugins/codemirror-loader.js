// Extensions built with a shell from before CodeMirror 6 render their editors with CodeMirror 5, which
// they expect Rancher to provide: they wait for window.__codeMirrorLoader and then render the global
// <Codemirror> component. Neither loads CodeMirror 5 until such an extension shows an editor.
//
// This is deprecated and will be removed along with CodeMirror 5.

import { defineAsyncComponent } from 'vue';

let warned = false;

function loadCodeMirror5() {
  if (!warned) {
    warned = true;
    console.warn('[CodeMirror] An extension is using CodeMirror 5, which is deprecated and will be removed. Rebuild the extension with a version of @rancher/shell that uses CodeMirror 6.'); // eslint-disable-line no-console
  }

  return import(/* webpackChunkName: "codemirror" */ '@shell/plugins/codemirror');
}

/**
 * The <Codemirror> component that CodeMirror 5 editors from older shells render
 */
export const CodeMirror5 = defineAsyncComponent(() => import(/* webpackChunkName: "codemirror" */ 'codemirror-editor-vue3').then((m) => m.default));

if ( !window.__codeMirrorLoader ) {
  window.__codeMirrorLoader = loadCodeMirror5;
}
