/**
 * Declarations for the untyped `object.js` in this directory, so that `.ts` modules
 * importing it still type-check when an extension builds against `@rancher/shell`
 * (its own `tsconfig` sets `checkJs: false`, so the `.js` has no types of its own).
 *
 * Seeded from:
 *   ./node_modules/.bin/tsc shell/utils/object.js --declaration --allowJs --emitDeclarationOnly --outDir <tmp>
 * then adjusted to declare `isEqual` directly, since the private `isEqualBasic` it
 * aliases in the `.js` is not part of the module's public surface.
 */

export function set(obj: any, path: any, value: any): any;
export function getAllValues(obj: any, path: any): any[];
export function get(obj: any, path: any): any;
export function remove(obj: any, path: any, pruneEmptyParents?: boolean): any;
/**
 * `delete` a property at the given path.
 *
 * This is similar to `remove` but doesn't need any fancy kube obj path splitting
 * and doesn't use `Vue.set` (avoids reactivity)
 */
export function deleteProperty(obj: any, path: any): void;
export function getter(path: any): (obj: any) => any;
export function clone(obj: any): any;
export function isEmpty(obj: any): boolean;
/**
 * Checks to see if the object is a simple key value pair where all values are
 * just primitives.
 * @param {any} obj
 */
export function isSimpleKeyValue(obj: any): boolean;
export function cleanUp(obj: any): any;
export function definedKeys(obj: any): any;
export function diff(from: any, to: any, preventNull?: boolean): any;
export function changeset(from: any, to: any, parentPath?: any[]): {};
export function changesetConflicts(a: any, b: any): any[];
export function applyChangeset(obj: any, changeset: any): any;
/**
 * Creates an object composed of the `object` properties `predicate` returns
 */
export function pickBy(obj?: {}, predicate?: (value: any, key: any) => boolean): {};
export function dropKeys(obj: any, keys: any): void;
/**
 * Recursively convert a reactive object to a raw object
 * @param {*} obj
 * @param {*} cache
 * @returns
 */
export function deepToRaw(obj: any, cache?: any): any;
/**
 * Helper function to alter Lodash merge function default behaviour on merging
 * arrays and objects.
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

 * This helper function addresses the issue by always replacing the old array with the new array during the merge process.
 *
 * This helper is also used for another case in rke2.vue to handle merging addon chart default values with the user's current values.
 * It fixed https://github.com/rancher/dashboard/issues/12418
 *
 * If `mutateOriginal` is true, the merge is done directly into `obj1` (mutating it).
 * This is useful in cases like:
 *   machinePool.config = mergeWithReplace(clonedLatestConfig, clonedCurrentConfig, { mutateOriginal: true })
 * where merging into a new empty object may lead to incomplete structure.
 *
 * Use `mutateOriginal` when you want to preserve obj1’s original shape, references,
 * or when assigning the result directly to an existing object.
 *
 * @param {Object} [obj1={}] - The first object to merge
 * @param {Object} [obj2={}] - The second object to merge
 * @param {Object} [options={}] - Options for customizing merge behavior
 * @param {boolean} [options.mutateOriginal=false] - true: mutates obj1
 *                  directly. false: returns a new object
 * @param {boolean} [options.replaceArray=true] - true: replaces arrays in obj1
 *                  with arrays in obj2 when both properties are arrays
 *                  false: default lodash merge behavior - recursively merges
 *                  array members
 */
export function mergeWithReplace(obj1?: any, obj2?: any, { mutateOriginal, replaceArray }?: {
    mutateOriginal?: boolean;
    replaceArray?: boolean;
}): any;
export function toDictionary(array: any, callback: any): any;
export function convertKVToString(input: any): string;
export function convertStringToKV(input: string): {};
/**
 * Super simple lodash isEqual equivalent.
 *
 * Only checks root properties for strict equality
 */
export function isEqual(from: any, to: any): boolean;
