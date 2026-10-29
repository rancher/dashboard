let loader = () => undefined;

/**
 * Provide the lookup for the dashboard's own models
 *
 * @param {(type: string) => object | undefined} lookup returns the model module for a type, or for `<store>/<type>`
 * when a model only applies to one store
 */
export function setModelLoader(lookup) {
  loader = lookup;
}

/**
 * Fetch a model from the dashboard's local model's folder
 *
 * Splitting this out into a separate function means packages can
 * override this to ensure dashboard models aren't bundled with it
 *
 * @param {string} type
 * @returns Model for the given type
 */
export default function modelLoaderRequire(type) {
  return loader(type);
}
