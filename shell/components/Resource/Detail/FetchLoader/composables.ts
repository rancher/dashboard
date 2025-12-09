import { computed, ref, toValue } from 'vue';

export const useFetch = <T>(fetch: () => Promise<T>) => {
  const loading = ref<boolean>(true);
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

  load();

  return computed(() => ({
    loading:    loading.value,
    data:       data.value,
    error:      error.value,
    refresh,
    refreshing: refreshing.value
  }));
};
