import { getCurrentInstance } from 'vue';
import { Store } from 'vuex';

/**
 * useStore allows for accessing Vuex stores from within a setup function. This is a temporary measure for working with
 * Vuex in Vue2.
 *
 * TODO: #9541 Remove for Vue 3 migration
 */
export const useStore = ():Store<any> => {
  const vm = getCurrentInstance();

  if (!vm) throw new Error('useStore() must be called from setup()');

  return vm.proxy.$store;
};
