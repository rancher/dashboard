/**
 * A key identifying one resource, unique across types
 *
 * A namespaced Steve `id` is `namespace/name`, which is not unique across types.
 */
export const keyForResource = (resource?: { type?: string, id?: string } | null): string => {
  if (!resource?.id) {
    return '';
  }

  return `${ resource.type || '' }:${ resource.id }`;
};
