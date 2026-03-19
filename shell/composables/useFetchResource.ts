import { getCurrentInstance, onBeforeUnmount, reactive } from 'vue';
import type { FetchResourceOptions } from '@shell/types/resources/fetch-resource';
import { PaginatedResourceArray } from '@shell/resources/PaginatedResourceArray';

export function useFetchResource() {
  const instance = getCurrentInstance();

  if (!instance) {
    throw new Error('useFetchResource must be called within a component setup context');
  }

  const $store = instance.proxy.$store;
  const $axios = instance.proxy.$axios;
  const paginatedResourceArrays: PaginatedResourceArray[] = [];

  function fetchResource(resourceName: string, options?: FetchResourceOptions): PaginatedResourceArray {
    const storeName: string = $store.getters['currentStore'](resourceName);
    const pra = reactive(
      new PaginatedResourceArray($axios, $store, storeName, resourceName, options?.pagination, options),
    ) as PaginatedResourceArray;

    // Call load on the reactive proxy so mutations are tracked
    pra.load();
    paginatedResourceArrays.push(pra);

    return pra;
  }

  onBeforeUnmount(() => {
    paginatedResourceArrays.forEach((pra) => pra.dispose());
    paginatedResourceArrays.length = 0;
  });

  return { fetchResource };
}
