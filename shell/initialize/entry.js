import fetch from 'unfetch';
import { extendApp } from './app-extended.js';
import fetchMixin from '@shell/mixins/fetch.client.js';
import { loadDebugger, mountApp } from '@shell/initialize/entry-helpers';
import { installDirectives } from '@shell/initialize/install-directives.js';
import { installComponents } from '@shell/initialize/install-components.js';
import { installPlugins } from '@shell/initialize/install-plugins.js';
import App from '@shell/initialize/App.vue';
import { createApp } from 'vue';

const vueApp = createApp(App);

// Fetch mixin
vueApp.mixin(fetchMixin);

// Bulk install components
installComponents(vueApp);

// Bulk install directives
installDirectives(vueApp);

// Bulk install Plugins. Note: Some are added within the App itself
installPlugins(vueApp);

if (!global.fetch) {
  global.fetch = fetch;
}

loadDebugger(vueApp);
const errorHandler = vueApp.config.errorHandler || console.error; // eslint-disable-line no-console

// Create and mount App
extendApp(vueApp).then((appPartials) => mountApp(appPartials, vueApp)).catch(errorHandler); // eslint-disable-line no-undef
