import { AUTOSCALER } from '@shell/store/features';

export function isAutoscalerFeatureFlagEnabled(store: any): boolean {
  const rootGetters = store.rootGetters || store.getters;

  return rootGetters['features/get'](AUTOSCALER);
}
