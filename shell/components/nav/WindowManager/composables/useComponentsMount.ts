import {
  ref,
  markRaw,
} from 'vue';
import { useStore } from 'vuex';

const warn = (msg: string, ...args: any[]) => {
  console.warn(`[wm] ${ msg } ${ args?.reduce((acc, v) => `${ acc } '${ v }'`, '') }`); /* eslint-disable-line no-console */
};

/**
 * This composable is responsible for loading the tabs body components.
 *
 * - It supports loading components from Rancher extensions as well as from the TypeMap (defined in shell/components/Window directory).
 * - The component is cached after the first load to optimize performance.
 *
 * Loading a component from extension:
 *
 *   // Register the component in the extension index file:
 *   plugin.register('component', 'TestComponent', defineAsyncComponent(() => import('./pages/TestComponent.vue')));
 *
 *   // Use the component in a tab by specifying its name and extensionId:
 *   store.dispatch('wm/open', {
 *     id:            PRODUCT_NAME,
 *     extensionId:   PRODUCT_NAME,
 *     label:         'Label',
 *     component:     'TestComponent',
 *     position:      'bottom',
 *     layouts:       [
 *       Layout.default,
 *       Layout.home
 *     ],
 *     showHeader: false,
 *   }, { root: true });
 *
 */

export default () => {
  const store = useStore();

  const components = ref<any>({});

  function loadComponent(tab: { component?: string, extensionId?: string }) {
    const { component: name, extensionId } = tab || {};

    if (!name) {
      warn('component name not provided');

      return null;
    }

    if (!components.value[name]) {
      if (!!extensionId) {
        warn(`loading component from extension`, name, extensionId);
        components.value[name] = markRaw((store as any).$extension?.getDynamic('component', name));
      } else if (store.getters['type-map/hasCustomWindowComponent'](name)) {
        warn(`loading component from TypeMap`, name);
        components.value[name] = markRaw(store.getters['type-map/importWindowComponent'](name));
      }
    }

    if (!components.value[name]) {
      warn(`component not found for`, name);
    }

    return components.value[name];
  }

  return { loadComponent };
};
