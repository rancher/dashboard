import '@shell/plugins/extend-router';
import '@shell/plugins/formatters';
import '@shell/plugins/global-formatters';
import '@shell/plugins/vue-js-modal';
import '@shell/plugins/js-yaml';
import '@shell/plugins/portal-vue.js';
import '@shell/plugins/resize';
import '@shell/plugins/shortkey';
import '@shell/plugins/tooltip';
import '@shell/plugins/trim-whitespace';
import '@shell/plugins/v-select';

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
import * as positiveIntNumber from '@shell/plugins/positive-int-number.js';
import replaceAll from '@shell/plugins/replaceall';
import steveCreateWorker from '@shell/plugins/steve-create-worker';
import version from '@shell/plugins/version';
import emberCookie from '@shell/plugins/ember-cookie';

export async function installPlugins(app, inject, Vue) {
  Vue.use(i18n);

  const pluginDefinitions = [cookieUniversalNuxt, axios, plugins, pluginsLoader, axiosShell, intNumber, positiveIntNumber, nuxtClientInit, replaceAll, backButton, plugin, codeMirror, version, steveCreateWorker, emberCookie];

  const installations = pluginDefinitions.map(async(pluginDefinition) => {
    if (typeof pluginDefinition === 'function') {
      await pluginDefinition(app.context, inject);
    }
  });

  await Promise.all(installations);
}
