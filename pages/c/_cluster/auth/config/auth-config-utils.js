import { _EDIT } from '@/config/query-params';
import { MANAGEMENT } from '@/config/types';

export const authProviders = async(store) => {
  const rows = await store.dispatch(`management/findAll`, { type: MANAGEMENT.AUTH_CONFIG });
  const nonLocal = rows.filter(x => x.name !== 'local');
  const enabled = nonLocal.filter(x => x.enabled === true );

  const enabledLocation = enabled.length === 1 ? {
    name:   'c-cluster-auth-config-id',
    params: { id: enabled[0].id },
    query:  { mode: _EDIT }
  } : null;

  return {
    nonLocal,
    enabledLocation
  };
};
