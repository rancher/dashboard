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
  return require(`@shell/models/${ type }`);
}
