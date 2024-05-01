import '@shell/plugins/extend-router';
import '@shell/plugins/formatters';
import globalFormatters from '@shell/plugins/global-formatters';
import '@shell/plugins/vue-js-modal';
import '@shell/plugins/js-yaml';
import portalVue from '@shell/plugins/portal-vue.js';
import vueResize from '@shell/plugins/resize';
import vShortKey from '@shell/plugins/shortkey';
import vueTooltip from '@shell/plugins/tooltip';
import vueSelect from '@shell/plugins/v-select';

import i18n from '@shell/plugins/i18n';

import axios from '../utils/axios.js';
import axiosShell from '@shell/plugins/axios';
import backButton from '@shell/plugins/back-button';
import codeMirror from '@shell/plugins/codemirror-loader';
import cookieUniversalNuxt from '../utils/cookie-universal-nuxt.js';
import * as intNumber from '@shell/plugins/int-number';
import nuxtClientInit from '@shell/plugins/nuxt-client-init';
import plugin from '@shell/plugins/plugin';
import plugins from '@shell/core/plugins.js';
import pluginsLoader from '../core/plugins-loader.js';
import positiveIntNumber from '@shell/plugins/positive-int-number.js';
import replaceAll from '@shell/plugins/replaceall';
import steveCreateWorker from '@shell/plugins/steve-create-worker';
import version from '@shell/plugins/version';
import emberCookie from '@shell/plugins/ember-cookie';

export async function installPlugins(app, inject, Vue) {
  Vue.use(vueSelect);
  Vue.use(globalFormatters);
  Vue.use(portalVue);
  Vue.use(vueResize);
  Vue.use(vueTooltip);
  Vue.use(positiveIntNumber); // It's a directive, maybe it should be moved to plugins/index.js ?
  Vue.use(vShortKey);

  const pluginDefinitions = [cookieUniversalNuxt, axios, plugins, pluginsLoader, axiosShell, intNumber, positiveIntNumber, nuxtClientInit, replaceAll, backButton, plugin, codeMirror, version, steveCreateWorker, emberCookie];

  const installations = pluginDefinitions.map(async(pluginDefinition) => {
    if (typeof pluginDefinition === 'function') {
      await pluginDefinition(app.context, inject);
    }
  });

  await Promise.all(installations);

  // Order matters here. This is coming after the other plugins specifically so $cookies can be installed. i18n/init relies on prefs/get which relies on $cookies.
  Vue.use(i18n, { store: app.store });
}
