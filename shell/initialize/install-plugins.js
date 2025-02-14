import PortalVue from 'portal-vue';
import Vue3Resize from 'vue3-resize';
import FloatingVue from 'floating-vue';
import vSelect from 'vue-select';
import 'vue3-resize/dist/vue3-resize.css';

// import '@shell/plugins/extend-router';
import '@shell/plugins/formatters';
import '@shell/plugins/js-yaml';

import i18n from '@shell/plugins/i18n';
import globalFormatters from '@shell/plugins/global-formatters';

import axios from '@shell/utils/axios';
import cookieUniversal from '@shell/utils/cookie-universal';
import config from '@shell/utils/config';
import axiosShell from '@shell/plugins/axios';
import codeMirror from '@shell/plugins/codemirror-loader';
import { InstallCodeMirror } from 'codemirror-editor-vue3';
import * as intNumber from '@shell/directives/int-number';
import nuxtClientInit from '@shell/plugins/nuxt-client-init';
import plugin from '@shell/plugins/plugin';
import plugins from '@shell/core/plugins.js';
import pluginsLoader from '@shell/core/plugins-loader.js';
import replaceAll from '@shell/plugins/replaceall';
import steveCreateWorker from '@shell/plugins/steve-create-worker';
import emberCookie from '@shell/plugins/ember-cookie';
import ShortKey from '@shell/plugins/shortkey';

import 'floating-vue/dist/style.css';
import { floatingVueOptions } from '@shell/plugins/floating-vue';

export async function installPlugins(vueApp) {
  vueApp.use(globalFormatters);
  vueApp.use(PortalVue);
  vueApp.use(Vue3Resize);
  vueApp.use(FloatingVue, floatingVueOptions);
  vueApp.use(
    ShortKey,
    {
      prevent:          ['input', 'textarea', 'select'],
      preventContainer: ['#modal-container-element']
    });
  vueApp.use(InstallCodeMirror);
  vueApp.component('v-select', vSelect);
}

export async function installInjectedPlugins(app, vueApp) {
  const pluginDefinitions = [config, cookieUniversal, axios, plugins, pluginsLoader, axiosShell, intNumber, codeMirror, nuxtClientInit, replaceAll, plugin, steveCreateWorker, emberCookie];

  const installations = pluginDefinitions.map(async(pluginDefinition) => {
    if (typeof pluginDefinition === 'function') {
      await pluginDefinition(
        app.context,
        (key, value) => inject(key, value, app.context, vueApp)
      );
    }
  });

  await Promise.all(installations);

  // We had i18n/init happening asynchronously within the i18n installation method. We need this to happen synchronously otherwise we end up with race conditions where some pages won't load when translated.
  // If there's any performance reasons this can be done concurrently with all of the installation promises above but I felt it was organizationally better to keep both i18n items together.
  await app.store.dispatch('i18n/init');

  // Order matters here. This is coming after the other plugins specifically so $cookies can be installed. i18n/init relies on prefs/get which relies on $cookies.
  vueApp.use(i18n, { store: app.store });
}

/**
 * Injects a key-value pair into a given context and installs a Vue plugin with
 * the provided key-value pair.
 *
 * @param {string} key The key to be injected
 * @param {*} value The value to be injected
 * @param {object} context The context object into which the key-value pair will
 * be injected
 * @param {object} vueApp The Vue instance
 * @returns {void}
 *
 * @property {object} context.app The app object within the context
 * @property {object} context.store The store object within the context
 *
 * Note: This function mutates the context object, including the context app and
 * store.
 */
function inject(key, value, context, vueApp) {
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
  const installKey = `__plugin_${ key }_installed__`;

  window.installedPlugins = window.installedPlugins || {};

  if (window.installedPlugins[installKey]) {
    return;
  }
  window[window.installedPlugins] = true;

  // Call vueApp.use() to install the plugin into vm
  vueApp.use(() => {
    if (!Object.prototype.hasOwnProperty.call(vueApp.config.globalProperties, key)) {
      Object.defineProperty(vueApp.config.globalProperties, key, {
        get() {
          return app.context[key];
        }
      });
    }
  });
}
