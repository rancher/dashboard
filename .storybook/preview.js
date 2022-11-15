import Vue from 'vue';
import Vuex from 'vuex';
import { themes } from '@storybook/theming';
import { get } from '../shell/utils/object';
import IntlMessageFormat from 'intl-messageformat';
import installShortcut from './theme-shortcut';
import withEvents from 'storybook-auto-events';

const i18nStrings = require('../shell/assets/translations/en-us.yaml');

// Register custom i18n plugin
require('../shell/plugins/i18n');

require('../shell/plugins/v-select');
require('../shell/plugins/tooltip');


Vue.use(Vuex);

// Defines namespaced modules for the Store.
const growl = {
  namespaced: true,
  state: {
    stack: [{
      id: 1,
      color: 'success',
      icon: 'checkmark',
      timeout: 5000,
      title: 'Success',
      message: 'This is a success message'
    },
    {
      id: 2,
      color: 'info',
      icon: 'info',
      timeout: 5000,
      title: 'Info',
      message: 'This is an info message'
    },
    {
      id: 3,
      color: 'warning',
      icon: 'warning',
      timeout: 5000,
      title: 'Warning',
      message: 'This is an warning message'
    },
    {
      id: 4,
      color: 'error',
      icon: 'error',
      timeout: 5000,
      title: 'Warning',
      message: 'This is an warning message'
    },
    ],
  },
  getters: require("../shell/store/growl.js").getters,
  actions: require("../shell/store/growl.js").actions,
  mutations: require("../shell/store/growl.js").mutations
}

export const store = new Vuex.Store({
  getters: {
    'i18n/t': state => (key, args) => {
      const msg = get(i18nStrings, key) || key;

      if (msg?.includes('{')) {
        const formatter = new IntlMessageFormat(msg, state.selected);
        return formatter.format(args);
      }

      return msg;
    }
  },
  modules: {
    growl
  }
});


const storePlugin = {
  store,
  install (Vue, options) {
    Vue.prototype.$store = store
  }
};

Vue.use(storePlugin);

export const parameters = {
  previewTabs: {
    canvas: { hidden: false },
  },
  actions: { argTypesRegex: "^on[A-Z].*" },
  layout: 'centered',
  // viewMode: 'docs',
  // Auto set controls based on the property name
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  darkMode: {
    dark: {
      ...themes.dark,
      brandTitle: 'Rancher Storybook',
      brandImage: '/dark/rancher-logo.svg'
    },
    light: {
      ...themes.normal,
      brandTitle: 'Rancher Storybook',
      brandImage: '/rancher-logo.svg'
    },
    darkClass: 'theme-dark',
    lightClass: 'theme-light',
    stylePreview: true
  }
}

export const decorators = [
  withEvents
];

// Add keyboard shortcut to toggle between dark and light modes
window.onload = () => {
  installShortcut();
}
