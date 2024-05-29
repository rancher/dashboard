// Taken from @nuxt/vue-app/template/client.js

import Vue from 'vue';
import fetch from 'unfetch';
import { extendApp } from './app-extended.js';
import fetchMixin from '@shell/mixins/fetch.client.js';
import { loadDebugger, mountApp } from '@shell/initialize/entry-helpers';
import { installDirectives } from '@shell/initialize/install-directives.js';
import { installComponents } from '@shell/initialize/install-components.js';
import { installPlugins } from '@shell/initialize/install-plugins.js';

// Fetch mixin
Vue.mixin(fetchMixin);

// Bulk install components
installComponents(Vue);

// Bulk install directives
installDirectives(Vue);

// Bulk install Plugins. Note: Some are added within the App itself
installPlugins(Vue);

if (!global.fetch) {
  global.fetch = fetch;
}

loadDebugger(Vue);
const errorHandler = Vue.config.errorHandler || console.error; // eslint-disable-line no-console

// Create and mount App
extendApp(Vue).then((appPartials) => mountApp(appPartials, Vue)).catch(errorHandler); // eslint-disable-line no-undef
