import type { Preview } from "@storybook/vue3";
import { setup } from '@storybook/vue3';
import RancherTheme from './theme-rancher';
import '../src/assets/style.scss';

import vSelect from 'vue-select';
import FloatingVue from 'floating-vue';
import { floatingVueOptions } from '@shell/plugins/floating-vue';
import cleanTooltipDirective  from '@shell/directives/clean-tooltip';
import ShortKey from '@shell/plugins/shortkey';
import cleanHtmlDirective from '@shell/directives/clean-html';
import trimWhitespaceDirective from '@shell/directives/trim-whitespace';
import htmlStrippedAriaLabelDirective from '@shell/directives/strip-html-aria-label';
import store from './store'
import { withThemeByClassName } from '@storybook/addon-themes';
import 'floating-vue/dist/style.css';

// i18n
import i18n from '@shell/plugins/i18n';

setup((vueApp) => {
  vueApp.use(store);
  vueApp.use(i18n, { store });
  vueApp.use(FloatingVue, floatingVueOptions);
  vueApp.directive('clean-html', cleanHtmlDirective);
  vueApp.directive('clean-tooltip', cleanTooltipDirective);
  vueApp.directive('trim-whitespace', trimWhitespaceDirective);
  vueApp.directive('stripped-aria-label', htmlStrippedAriaLabelDirective);

  vueApp.component('v-select', vSelect);
  vueApp.use(ShortKey, { prevent: ['input', 'textarea', 'select'] });
  const RouterLinkStub = {
    props:    ['to'],
    template: '<a :href="typeof to === \'string\' ? to : \'#\'"><slot /></a>',
  };
  vueApp.component('router-link', RouterLinkStub);
  vueApp.component('RouterLink', RouterLinkStub);
  vueApp.config.globalProperties.$store = store
})

const preview: Preview = {
  parameters: {
    // This disables the background selector control, it conflicts with the theme selector
    backgrounds: {
      disable: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: (a, b) => {
        const order = ['Welcome', 'Foundation', 'Form', 'Components', 'Examples'];
        const rank = (title) => {
          const index = order.indexOf(title.split('/')[0]);

          return index === -1 ? order.length : index;
        };

        if (a.title === b.title) {
          return 0;
        }

        return rank(a.title) - rank(b.title) || a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
      },
    },
    docs: {
      theme: RancherTheme,
      toc: true, // 👈 Enables the table of contents
    },
  },
  tags: ['autodocs'],
  decorators: [
    // This adds the theme-light/theme-dark classes to the body of the document when the theme changes
    withThemeByClassName({
      themes: {
        light: 'theme-light',
        dark: 'theme-dark',
      },
      defaultTheme: 'light',
      parentSelector: 'body'
    }),
  ]
};

export default preview;
