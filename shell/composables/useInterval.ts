import { onBeforeUnmount, onMounted, ref } from 'vue';

export const useInterval = (fn: Function, delay: number) => {
  const interval = ref<any>(null);

  onMounted(() => {
    interval.value = setInterval(fn, delay);
  });

  onBeforeUnmount(() => {
    if (interval.value) {
      clearInterval(interval.value);
    }
  });
};
