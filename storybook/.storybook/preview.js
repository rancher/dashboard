import  { setup }  from '@storybook/vue3';
import { createStore } from 'vuex'
import vSelect from 'vue-select';
import FloatingVue from 'floating-vue';
import { themes } from '@storybook/theming';
import { get } from '../../shell/utils/object';
import IntlMessageFormat from 'intl-messageformat';
import installShortcut from './theme-shortcut';
import withEvents from 'storybook-auto-events';
const i18nStrings = require('../../shell/assets/translations/en-us.yaml');
import cleanTooltipDirective  from '@shell/directives/clean-tooltip';
import ShortKey from 'vue-shortkey';
import cleanHtmlDirective from '@shell/directives/clean-html';

// Store modules
import growl from './store/growl';
import codeMirror from './store/codeMirror';
import table from './store/table';

// i18n
import i18n from '../../shell/plugins/i18n';

setup((vueApp) => {
  vueApp.use(i18n, { store: { dispatch() {} } });
  vueApp.use(FloatingVue);
  vueApp.directive('clean-html', cleanHtmlDirective);
  vueApp.directive('clean-tooltip', cleanTooltipDirective);
  vueApp.component('v-select', vSelect);
  vueApp.use(ShortKey, { prevent: ['input', 'textarea', 'select'] });
  vueApp.component('router-link', {
    props:   ['to'],
    template: '<a>link</a>',
  })

  vueApp.use(storePlugin);

  window.__codeMirrorLoader = () => import(/* webpackChunkName: "codemirror" */ '@shell/plugins/codemirror');
})

const storePlugin = {
  store: createStore({
    getters: {
      'i18n/exists': key => store.getters['i18n/t'],
      'i18n/t': state => (key, args) => {
        const msg = get(i18nStrings, key) || key;
  
        if (msg?.includes('{')) {
          const formatter = new IntlMessageFormat(msg, state.selected);
          return formatter.format(args);
        }
  
        return msg;
      },
    },
    modules: {
      growl,
      codeMirror,
      table
    }
  }),
  install (vueApp, options) {
    vueApp.prototype.$store = store
  }
};

const preview = {
  parameters: {
    options: {
      storySort: {
        order: ['Foundation', 'Form', 'Components', 'Examples'],
      },
    },
    previewTabs: {
      canvas: { hidden: false },
    },
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
        brandImage: 'dark/rancher-logo.svg'
      },
      light: {
        ...themes.normal,
        brandTitle: 'Rancher Storybook',
        brandImage: 'rancher-logo.svg'
      },
      darkClass: 'theme-dark',
      lightClass: 'theme-light',
      stylePreview: true
    }
  }
}


// Add keyboard shortcut to toggle between dark and light modes
window.onload = () => {
  installShortcut();
}

export const decorators = [ withEvents ];
export default preview;
