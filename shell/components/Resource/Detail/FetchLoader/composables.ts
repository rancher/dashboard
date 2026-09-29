import { computed, ref, toValue } from 'vue';

export interface UseFetchOptions {
  /**
   * Call the fetch function straight away. When false nothing is fetched until `load` is called
   */
  immediate?: boolean;
}

export const useFetch = <T>(fetch: () => Promise<T>, { immediate = true }: UseFetchOptions = {}) => {
  const loading = ref<boolean>(immediate);
  const refreshing = ref<boolean>(false);
  const data = ref<T>();
  const error = ref<any>();

  const load = async() => {
    try {
      loading.value = true;

      data.value = toValue(await fetch());
    } catch (ex) {
      error.value = ex;
      console.error('Error fetching data', ex); // eslint-disable-line no-console
    } finally {
      loading.value = false;
    }
  };

  const refresh = async() => {
    if (loading.value) {
      return;
    }

    refreshing.value = true;
    await load();
    refreshing.value = false;
  };

  // Existing callers fetch as soon as they're set up. Popovers in list rows pass immediate: false and call load on first
  // hover or focus, so a page of rows doesn't send one request per row before anyone looks at a card
  if (immediate) {
    load();
  }

  return computed(() => ({
    loading:    loading.value,
    data:       data.value,
    error:      error.value,
    load,
    refresh,
    refreshing: refreshing.value
  }));
};
