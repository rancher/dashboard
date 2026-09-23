import * as vue3 from 'vue';
import * as vueRouter from 'vue-router';
import $ from 'jquery';
import JSZip from 'jszip';
import jsyaml from 'js-yaml';
import * as cmAutocomplete from '@codemirror/autocomplete';
import * as cmCommands from '@codemirror/commands';
import * as cmLangJson from '@codemirror/lang-json';
import * as cmLangYaml from '@codemirror/lang-yaml';
import * as cmLanguage from '@codemirror/language';
import * as cmSearch from '@codemirror/search';
import * as cmState from '@codemirror/state';
import * as cmThemeOneDark from '@codemirror/theme-one-dark';
import * as cmView from '@codemirror/view';
import * as lezerCommon from '@lezer/common';
import * as cmVim from '@replit/codemirror-vim';

// Load any plugins that are present as npm modules
// The 'dynamic' module is generated in webpack to load each package

const dynamicLoader = require('@rancher/dynamic');

export default function({
  app,
  store,
  $axios,
  redirect,
  $extension,
}, inject) {
  if (dynamicLoader) {
    dynamicLoader.default($extension);
  }

  // The libraries we build have Vue externalised, so we need to expose Vue as a global for
  // them to pick up - see: https://cli.vuejs.org/guide/build-targets.html#library
  // window.Vue = Vue;

  // Global libraries - allows us to externalise these to reduce package bundle size
  window.Vue = vue3;
  window.__vueRouter = vueRouter;
  window.$ = $;
  window.__jszip = JSZip;
  window.__jsyaml = jsyaml;

  // CodeMirror 6 relies on object identity across its packages (a second copy of @codemirror/state
  // rejects extensions from the first), so extensions share the host's copy. Keyed by package name
  window.__codemirror = {
    '@codemirror/autocomplete':   cmAutocomplete,
    '@codemirror/commands':       cmCommands,
    '@codemirror/lang-json':      cmLangJson,
    '@codemirror/lang-yaml':      cmLangYaml,
    '@codemirror/language':       cmLanguage,
    '@codemirror/search':         cmSearch,
    '@codemirror/state':          cmState,
    '@codemirror/theme-one-dark': cmThemeOneDark,
    '@codemirror/view':           cmView,
    '@lezer/common':              lezerCommon,
    '@replit/codemirror-vim':     cmVim,
  };
}
