export async function fetchClusterResources(store, type, opt = {}) {
  const schema = store.getters['cluster/schemaFor'](type);

  if (schema) {
    try {
      const resources = await store.dispatch('cluster/findAll', { type, opt });

      return resources;
    } catch (err) {
      console.error(`Failed fetching cluster resource ${ type } with error:`, err); // eslint-disable-line no-console

      return [];
    }
  }

  return [];
}
