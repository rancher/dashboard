/**
 * Whether the table views feature is turned on.
 *
 * One place to ask, because the feature shows itself in three that have nothing else in common:
 * the toolbar above a list, the masthead layout the table draws around it, and the export offered
 * on a resource's own actions. All three have to agree, or turning it off leaves half of it behind.
 */

import { IMPROVED_TABLES } from '@shell/store/features';

/** Anything that can answer a getter: a store, or a store action's context */
export interface GetterSource {
  getters?: Record<string, unknown>;
  rootGetters?: Record<string, unknown>;
}

/**
 * `store` is either a store or an action context, so this is callable from a component, a model
 * (`$rootGetters`) and a store action alike.
 */
export function isImprovedTablesEnabled(store?: GetterSource | null): boolean {
  const get = (store?.rootGetters || store?.getters)?.['features/get'];

  // There is not always a features store to ask: a resource built with a partial context has no
  // getters at all, and asking before the store is up would flicker a table into the other layout
  // a tick later. The flag's own default is on, so that is the answer when nobody can say.
  if (typeof get !== 'function') {
    return true;
  }

  return !!get(IMPROVED_TABLES);
}
