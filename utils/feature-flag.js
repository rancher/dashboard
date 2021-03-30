import { MANAGEMENT } from '@/config/types';

export const EMBEDDED_CLUSTER_API = 'embedded-cluster-api';
export const FLEET = 'fleet';
export const ISTIO_VIRTUAL_SERVICE_UI = 'istio-virtual-service-ui';
export const RKE2 = 'rke2';
export const UNSUPPORTED_STORAGE_DRIVERS = 'unsupported-storage-drivers';

export async function fetchFeatureFlag(store, key) {
  if (!store.getters['isRancher']) {
    return false;
  }

  try {
    const featureFlag = await store.dispatch('management/find', { type: MANAGEMENT.FEATURE, id: key });

    return featureFlag.enabled;
  } catch (ex) {
    return false;
  }
}
