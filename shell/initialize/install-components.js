
import NuxtChild from '@shell/components/nuxt/nuxt-child.js';
import vSelect from 'vue-select';

/**
 * Add components to the Vue instance
 * @param {*} vueApp Vue instance
 * TODO: #11070 - Remove Nuxt residuals
 */
export const installComponents = (vueApp) => {
  // Component: <NuxtChild>
  vueApp.component(NuxtChild.name, NuxtChild);
  vueApp.component('NChild', NuxtChild);

  // Vendor components
  vueApp.component('v-select', vSelect);
};
