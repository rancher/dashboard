import { getCurrentInstance } from 'vue';

export const useStore = ():unknown => {
  const vm = getCurrentInstance();

  if (!vm) throw new Error('useStore() must be called from setup()');

  return vm.proxy.$store;
};
