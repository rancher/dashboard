import {
  ref,
  markRaw,
} from 'vue';
import { useStore } from 'vuex';

const warn = (msg: string, ...args: any[]) => {
  console.warn(`[wm] ${ msg } ${ args?.reduce((acc, v) => `${ acc } '${ v }'`, '') }`); /* eslint-disable-line no-console */
};

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
