import mergeWith from 'lodash/mergeWith';

/**
 * Helper function to correctly merge array values while updating configurations.
 *
 * In rke2.vue, the syncMachineConfigWithLatest function updates machine pool configurations by
 * merging the latest configuration from the backend with the changes made by the user.
 * However, the default behavior of Lodash's merge function does not handle array removals properly,
 * resulting in undesired outcomes when merging arrays, Example:
 *
 * const lastSavedConfigFromBE = { a: ["test"] };
 * const currentConfigByUser = { a: [] };
 * merge(lastSavedConfigFromBE, currentConfigByUser); // { a: ["test"] }
 *
 * This helper function addresses the issue by correctly handling array values during the merge process.
 */
export function customMerge(obj1 = {}, obj2 = {}): Object {
  return mergeWith(obj1, obj2, (obj1Value, obj2Value) => {
    if (Array.isArray(obj1Value) && Array.isArray(obj2Value)) {
      return obj2Value;
    }
  });
}
