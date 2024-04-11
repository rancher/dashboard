import '@shell/plugins/extend-router';
import '@shell/plugins/formatters';
import '@shell/plugins/js-yaml';

import globalFormatters from '@shell/plugins/global-formatters';
import i18n from '@shell/plugins/i18n';
import VModal from 'vue-js-modal';
import PortalVue from 'portal-vue';
import VueResize from '@shell/plugins/resize';
import ShortKey from 'vue-shortkey';
import VTooltip from 'v-tooltip';
import TrimWhitespace from '@shell/plugins/trim-whitespace';
import vSelect from 'vue-select';
import intNumber from '@shell/plugins/int-number';
import positiveIntNumber from '@shell/plugins/positive-int-number.js';

import axios from '../utils/axios.js';
import axiosShell from '@shell/plugins/axios';
import backButton from '@shell/plugins/back-button';
import codeMirror from '@shell/plugins/codemirror-loader';
import cookieUniversalNuxt from '../utils/cookie-universal-nuxt.js';
import nuxtClientInit from '@shell/plugins/nuxt-client-init';
import plugin from '@shell/plugins/plugin';
import plugins from '@shell/core/plugins.js';
import pluginsLoader from '../core/plugins-loader.js';
import replaceAll from '@shell/plugins/replaceall';
import steveCreateWorker from '@shell/plugins/steve-create-worker';
import version from '@shell/plugins/version';
import emberCookie from '@shell/plugins/ember-cookie';

export async function installPlugins(app, inject, Vue) {
  [
    i18n,
    globalFormatters,
    VModal, PortalVue,
    VueResize,
    ShortKey,
    VTooltip,
    TrimWhitespace,
    intNumber,
    positiveIntNumber
  ].forEach((plugin) => {
    Vue.use(plugin);
  });

  Vue.component('v-select', vSelect);

  const pluginDefinitions = [
    cookieUniversalNuxt,
    axios,
    plugins,
    pluginsLoader,
    axiosShell,
    nuxtClientInit,
    replaceAll,
    backButton,
    plugin,
    codeMirror,
    version,
    steveCreateWorker,
    emberCookie
  ];

  const installations = pluginDefinitions.map(async(pluginDefinition) => {
    if (typeof pluginDefinition === 'function') {
      await pluginDefinition(app.context, inject);
    }
  });

  await Promise.all(installations);
}
