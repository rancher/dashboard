/**
 * Where to navigate once the given resources have been deleted.
 *
 * If the current route is the detail page of the (single) resource being deleted, that page won't be valid after a
 * successful delete, so this returns the matching list route. Otherwise it returns an empty location (stay put).
 *
 * @param {object[]} resources - The resources being deleted
 * @returns {object|null} null when deleting several resources (list view, never redirects), else a route location
 */
export function doneLocationAfterRemove(resources) {
  if (resources.length > 1) {
    return null;
  }

  const resource = resources[0];

  if (resource.doneOverride) {
    return resource.doneOverride;
  }

  const currentRoute = resource.currentRoute();
  const out = {};
  const params = { ...currentRoute.params };

  if (params.id && (params.id === resource?.metadata?.name || params.id === resource.id)) {
    let { name = '' } = currentRoute;

    const idIndex = name.indexOf('-id');

    if (idIndex !== -1) {
      name = name.slice(0, idIndex);
    }

    if (params.namespace) {
      const namespaceIndex = name.indexOf('-namespace');

      if (namespaceIndex !== -1) {
        name = name.slice(0, namespaceIndex);
      }
      delete params.namespace;
    }
    delete params.id;

    out.params = params;
    out.name = name;
  }

  return out;
}
