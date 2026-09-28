
import { IMPROVED_TABLES } from '@shell/store/features';

export interface GetterSource {
  getters?: Record<string, unknown>;
  rootGetters?: Record<string, unknown>;
}

export function isImprovedTablesEnabled(store?: GetterSource | null): boolean {
  const get = (store?.rootGetters || store?.getters)?.['features/get'];

  // No store to ask, eg a resource with a partial context: use the flag's default, on
  if (typeof get !== 'function') {
    return true;
  }

  return !!get(IMPROVED_TABLES);
}
