import mergeWith from 'lodash/mergeWith';

/**
 * Helper function to alter Lodash merge function default behaviour on merging arrays while updating machine pool configuration.
 *
 * In rke2.vue, the syncMachineConfigWithLatest function updates machine pool configuration by
 * merging the latest configuration received from the backend with the current configuration updated by the user.
 * However, Lodash's merge function treats arrays like object so index values are merged and not appended to arrays
 * resulting in undesired outcomes for us, Example:
 *
 * const lastSavedConfigFromBE = { a: ["test"] };
 * const currentConfigByUser = { a: [] };
 * merge(lastSavedConfigFromBE, currentConfigByUser); // returns { a: ["test"] }; but we expect { a: [] };
 *
 * More info: https://github.com/lodash/lodash/issues/1313
 *
 * This helper function addresses the issue by always replacing the old array with the new array during the merge process.
 */
export function vspherePoolConfigMerge(obj1 = {}, obj2 = {}): Object {
  return mergeWith(obj1, obj2, (obj1Value, obj2Value) => {
    if (Array.isArray(obj1Value) && Array.isArray(obj2Value)) {
      return obj2Value;
    }
  });
}
