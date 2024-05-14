import PortalVue from 'portal-vue';
import VueResize from 'vue-resize';
import ShortKey from 'vue-shortkey';
import VTooltip from 'v-tooltip';
import vSelect from 'vue-select';
import 'vue-resize/dist/vue-resize.css';

import '@shell/plugins/extend-router';
import '@shell/plugins/formatters';
import '@shell/plugins/vue-js-modal';
import '@shell/plugins/js-yaml';

import i18n from '@shell/plugins/i18n';
import globalFormatters from '@shell/plugins/global-formatters';

import axios from '../utils/axios.js';
import axiosShell from '@shell/plugins/axios';
import backButton from '@shell/plugins/back-button';
import codeMirror from '@shell/plugins/codemirror-loader';
import VueCodemirror from 'vue-codemirror';
import cookieUniversalNuxt from '../utils/cookie-universal-nuxt.js';
import * as intNumber from '@shell/directives/int-number';
import nuxtClientInit from '@shell/plugins/nuxt-client-init';
import plugin from '@shell/plugins/plugin';
import plugins from '@shell/core/plugins.js';
import pluginsLoader from '../core/plugins-loader.js';
import replaceAll from '@shell/plugins/replaceall';
import steveCreateWorker from '@shell/plugins/steve-create-worker';
import version from '@shell/plugins/version';
import emberCookie from '@shell/plugins/ember-cookie';
import config from '@shell/utils/config';

export async function installPlugins(app, Vue) {
  Vue.use(globalFormatters);

  Vue.use(PortalVue);
  Vue.use(VueResize);
  Vue.use(VTooltip);
  Vue.use(ShortKey, { prevent: ['input', 'textarea', 'select'] });
  Vue.use(VueCodemirror);

  Vue.component('v-select', vSelect);
  const pluginDefinitions = [config, cookieUniversalNuxt, axios, plugins, pluginsLoader, axiosShell, intNumber, codeMirror, nuxtClientInit, replaceAll, backButton, plugin, version, steveCreateWorker, emberCookie];

  const installations = pluginDefinitions.map(async(pluginDefinition) => {
    if (typeof pluginDefinition === 'function') {
      await pluginDefinition(app.context, inject, Vue);
    }
  });

  await Promise.all(installations);

  // Order matters here. This is coming after the other plugins specifically so $cookies can be installed. i18n/init relies on prefs/get which relies on $cookies.
  Vue.use(i18n, { store: app.store });
}

function inject(key, value, context, Vue) {
  if (!key) {
    throw new Error('inject(key, value) has no key provided');
  }
  if (value === undefined) {
    throw new Error(`inject('${ key }', value) has no value provided`);
  }

  const { app, store } = context;

  key = `$${ key }`;
  // Add into app
  app[key] = value;
  // Add into context
  if (!app.context[key]) {
    app.context[key] = value;
  }

  // Add into store
  store[key] = app[key];

  // Check if plugin not already installed
  const installKey = `__nuxt_${ key }_installed__`;

  window.installedPlugins = window.installedPlugins || {};

  if (window.installedPlugins[installKey]) {
    return;
  }
  window[window.installedPlugins] = true;
  // Call Vue.use() to install the plugin into vm
  Vue.use(() => {
    if (!Object.prototype.hasOwnProperty.call(Vue.prototype, key)) {
      Object.defineProperty(Vue.prototype, key, {
        get() {
          return this.$root.$options[key];
        }
      });
    }
  });
}
