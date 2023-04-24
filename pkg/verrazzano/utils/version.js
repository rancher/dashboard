import { VERRAZZANO } from '@pkg/types';

export async function getVerrazzanoVersion(store) {
  const vz = await store.dispatch('management/findAll', { type: VERRAZZANO });

  return vz[0]?.status?.version;
}
