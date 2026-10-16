/**
 * Create a day 2 operation CR for imported clusters.
 *
 * @param {Function} dispatch - The Vuex dispatch function
 * @param {string} type - The operation CRD type
 * @param {object} spec - The operation spec
 * @param {string} namespace - The namespace for the operation CR
 * @param {string} namePrefix - The name prefix for the generated name
 * @param {object} [opt]
 * @param {boolean} [opt.notifyGeneratedName] - Show the generated name growl, for callers without their own success growl
 * @returns {Promise} The saved resource
 */
export async function createOperationCR(dispatch, type, spec, namespace, namePrefix, { notifyGeneratedName = false } = {}) {
  const resource = await dispatch('management/create', {
    type,
    metadata: { namespace, generateName: `${ namePrefix }-` },
    spec:     { ...{ ttl: 60 }, ...spec },
  }, { root: true });

  const saved = await resource.save();

  if (notifyGeneratedName) {
    saved.notifyGeneratedName();
  }

  return saved;
}
