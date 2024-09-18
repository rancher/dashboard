
import vSelect from 'vue-select';

/**
 * Add components to the Vue instance
 * @param {*} vueApp Vue instance
 */
export const installComponents = (vueApp) => {
  // Vendor components
  vueApp.component('v-select', vSelect);
};
