import { useI18n } from '@shell/composables/useI18n';
import { toValue } from 'vue';
import { useStore } from 'vuex';

export type ScaleFn = () => Promise<void>;
export const useScaling = (workloadName: string, scaleUpFn: ScaleFn, scaleDownFn: ScaleFn) => {
  const store = useStore();
  const i18n = useI18n(store);

  const scale = (scaleFn: () => Promise<void>, workloadName: string, direction: 'up' | 'down') => {
    return async() => {
      try {
        await scaleFn();
      } catch (err) {
        store.dispatch('growl/fromError', {
          title: i18n.t('workload.list.errorCannotScale', { workloadName, direction }),
          err
        },
        { root: true });
      }
    };
  };

  const workloadNameValue = toValue(workloadName);

  return {
    scaleUp:   scale(() => scaleUpFn(), workloadNameValue, 'up'),
    scaleDown: scale(() => scaleDownFn(), workloadNameValue, 'down')
  };
};
