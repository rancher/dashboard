import { NAMESPACE } from '@shell/config/types';

/**
 * Find the namespaces in which the current user may create resources of a given type.
 *
 * Uses steve's `?checkPermissions=` query parameter on the namespace collection: each namespace
 * comes back with a `resourcePermissions` map listing the verbs the user is granted on the type
 * in that namespace.
 *
 * @param store   Vuex store
 * @param inStore store the namespaces and the type belong to, e.g. `cluster`
 * @param type    schema id of the resource being created, e.g. `secret`
 * @returns ids of the namespaces the user may create `type` in, or `null` when that could not be
 *          determined (the request failed, or the API does not support `checkPermissions`)
 */
export async function fetchNamespacesAllowingCreate(store: any, inStore: string, type: string): Promise<Set<string> | null> {
  const collection = store.getters[`${ inStore }/schemaFor`](NAMESPACE)?.links?.collection;

  if (!collection) {
    return null;
  }

  try {
    const res = await store.dispatch(`${ inStore }/request`, { url: `${ collection }?checkPermissions=${ type }&include=metadata.name` });
    const namespaces: any[] = res?.data || [];

    if (namespaces.some((ns) => !ns.resourcePermissions)) {
      return null;
    }

    return new Set(namespaces
      .filter((ns) => !!ns.resourcePermissions[type]?.create)
      .map((ns) => ns.id));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`Unable to check which namespaces allow creating ${ type }; listing all of them`, e);

    return null;
  }
}
