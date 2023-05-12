import Vue from 'vue';
import $ from 'jquery';
import JSZip from 'jszip';
import jsyaml from 'js-yaml';

// Load any plugins that are present as npm modules
// The 'dynamic' module is generated in webpack to load each package

const dynamicLoader = require('@rancher/dynamic');

export default function({
  app,
  store,
  $axios,
  redirect,
  $plugin,
  nuxt
}, inject) {
  if (dynamicLoader) {
    dynamicLoader.default($plugin);
  }

  if (process.client) {
    // The libraries we build have Vue externalised, so we need to expose Vue as a global for
    // them to pick up - see: https://cli.vuejs.org/guide/build-targets.html#library
    window.Vue = Vue;

    // Global libraries - allows us to externalise these to reduce package bundle size
    window.$ = $;
    window.__jszip = JSZip;
    window.__jsyaml = jsyaml;
  }
}
