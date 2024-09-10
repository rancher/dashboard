
import NuxtChild from '@shell/components/nuxt/nuxt-child.js';
import { nuxtLinkAlias } from '@shell/components/nuxt/nuxt-link.client.js'; // should be included after ./index.js
import vSelect from 'vue-select';

/**
 * Add components to the Vue instance
 * @param {*} vueApp Vue instance
 * TODO: #11070 - Remove Nuxt residuals
 */
export const installComponents = (vueApp) => {
  // Component: <NuxtLink>
  // TODO: #9541 Remove for Vue 3 migration
  vueApp.component('NuxtLink', nuxtLinkAlias('NuxtLink'));
  vueApp.component('NLink', nuxtLinkAlias('NLink'));

  // Component: <NuxtChild>
  vueApp.component(NuxtChild.name, NuxtChild);
  vueApp.component('NChild', NuxtChild);

  // Vendor components
  vueApp.component('v-select', vSelect);
};
