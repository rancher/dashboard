/**
 * Create a day 2 operation CR for imported clusters.
 *
 * @param {Function} dispatch - The Vuex dispatch function
 * @param {string} type - The operation CRD type
 * @param {object} spec - The operation spec
 * @param {string} namespace - The namespace for the operation CR
 * @param {string} namePrefix - The name prefix for the generated name
 * @returns {Promise} The saved resource
 */
export async function createOperationCR(dispatch, type, spec, namespace, namePrefix) {
  const resource = await dispatch('management/create', {
    type,
    metadata: { namespace, generateName: `${ namePrefix }-` },
    spec:     { ...spec, ...{ ttl: 60 } },
  }, { root: true });

  return resource.save();
}
