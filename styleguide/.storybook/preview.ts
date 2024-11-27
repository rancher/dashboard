import type { Preview } from "@storybook/vue3";
import  { setup }  from '@storybook/vue3';
import vSelect from 'vue-select';
import FloatingVue from 'floating-vue';
import { floatingVueOptions } from '@shell/plugins/floating-vue';
// import { themes } from '@storybook/theming';
// import installShortcut from './theme-shortcut';
// import withEvents from 'storybook-auto-events';
import cleanTooltipDirective  from '@shell/directives/clean-tooltip';
import ShortKey from '@shell/plugins/shortkey';
import cleanHtmlDirective from '@shell/directives/clean-html';
import store from './store'

// i18n
import i18n from '../../shell/plugins/i18n';

setup((vueApp) => {
  vueApp.use(i18n, { store: { dispatch() {} } });
  vueApp.use(FloatingVue, floatingVueOptions);
  vueApp.directive('clean-html', cleanHtmlDirective);
  vueApp.directive('clean-tooltip', cleanTooltipDirective);
  vueApp.component('v-select', vSelect);
  vueApp.use(ShortKey, { prevent: ['input', 'textarea', 'select'] });
  vueApp.component('router-link', {
    props:   ['to'],
    template: '<a>link</a>',
  })

  // vueApp.use({
  //   install(vueApp) {
  //     // Vuex is used through the app with a global variable
  //     vueApp.config.globalProperties.$store = store
  //   },
  // });

  // window.__codeMirrorLoader = () => import(/* webpackChunkName: "codemirror" */ '@shell/plugins/codemirror');
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
