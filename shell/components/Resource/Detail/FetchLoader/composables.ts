import { computed, ref, toValue } from 'vue';

export const useFetch = <T>(fetch: () => Promise<T> ) => {
  const loading = ref<boolean>(true);
  const data = ref<T>();
  const error = ref<any>();

  const load = async() => {
    try {
      loading.value = true;

      data.value = toValue(await fetch());
    } catch (ex) {
      error.value = ex;
    } finally {
      loading.value = false;
    }
  };

  load();

  return computed(() => ({
    loading: loading.value,
    data:    data.value,
    error:   error.value
  }));
};
