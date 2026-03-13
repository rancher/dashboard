/**
 * Utility to replace dynamic require() calls for image/asset imports.
 *
 * Uses webpack's require.context to resolve assets at compile time,
 * then provides lookup functions by path.
 *
 * When migrating to Vite, replace the require.context calls below with:
 *
 *   const imgCtx = import.meta.glob(
 *     '@shell/assets/**\/*.{svg,png,jpg,jpeg,gif,ico,webp}',
 *     { eager: true, query: '?url', import: 'default' }
 *   );
 *
 *   const jsonCtx = import.meta.glob(
 *     '@shell/assets/**\/*.json',
 *     { eager: true }
 *   );
 */

// --- Webpack: require.context (compile-time transform) ---

let imgCtx = null;
let jsonCtx = null;

try {
  imgCtx = require.context('@shell/assets', true, /\.(svg|png|jpe?g|gif|ico|webp)$/);
} catch (e) {}

try {
  jsonCtx = require.context('@shell/assets', true, /\.json$/);
} catch (e) {}

/**
 * Convert an asset path to a require.context key.
 *
 * Input:  '~shell/assets/images/providers/aws.svg' or '@shell/assets/images/providers/aws.svg'
 * Output: './images/providers/aws.svg'
 *
 * @param {string} path
 * @returns {string}
 */
function toContextKey(path) {
  return `./${ path.replace(/^[~@]shell\/assets\//, '') }`;
}

/**
 * Look up an image asset URL by path, similar to Webpack's require() for images.
 *
 * Accepts paths with ~shell/ or @shell/ prefix.
 * Throws if the asset is not found (matching the original require() behavior),
 * so callers can use try/catch for fallback logic.
 *
 * @param {string} path - Asset path, e.g. '~shell/assets/images/providers/aws.svg'
 * @returns {string} The resolved asset URL
 * @throws {Error} If the asset is not found or imgCtx is not available
 */
export function requireAsset(path) {
  if (!imgCtx) {
    // Throw to match original require() behavior — callers rely on try/catch for fallback logic
    throw new Error(`Asset context not available for: ${ path }`);
  }

  const key = toContextKey(path);

  return imgCtx(key);
}

/**
 * Load a JSON file from @shell/assets.
 *
 * Throws if the JSON file is not found (matching the original require() behavior),
 * so callers can use try/catch for fallback logic.
 *
 * @param {string} path - Path like '~shell/assets/brand/suse/metadata.json'
 * @returns {object} The parsed JSON data
 * @throws {Error} If the JSON file is not found or jsonCtx is not available
 */
export function requireJson(path) {
  if (!jsonCtx) {
    // Throw to match original require() behavior — callers rely on try/catch for fallback logic
    throw new Error(`JSON context not available for: ${ path }`);
  }

  const key = toContextKey(path);
  const mod = jsonCtx(key);

  return mod.default || mod;
}
