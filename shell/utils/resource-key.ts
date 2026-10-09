/**
 * A key identifying one resource, unique across types
 *
 * A namespaced Steve `id` is `namespace/name`, which is not unique across types. CAPI names an
 * infrastructure cluster after the cluster that references it, so an AWSCluster and a provisioning
 * cluster routinely share an `id`. Anything keyed on `id` alone treats the two as one resource.
 *
 * Used to de-duplicate resources and, in the multi-resource YAML editor, as the `nodeId` of a
 * resource's node in the graph and the key of its YAML in `editorState.yaml`.
 *
 * Empty when the resource has no `id`, so a caller can fall back to an identity of its own.
 */
export const keyForResource = (resource?: { type?: string, id?: string } | null): string => {
  if (!resource?.id) {
    return '';
  }

  return `${ resource.type || '' }:${ resource.id }`;
};
