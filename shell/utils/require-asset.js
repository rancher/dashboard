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
 * Returns the resolved asset URL string, or null if not found.
 *
 * @param {string} path - Asset path, e.g. '~shell/assets/images/providers/aws.svg'
 * @returns {string|null} The resolved asset URL or null
 */
export function requireAsset(path) {
  if (!imgCtx) {
    return null;
  }

  const key = toContextKey(path);

  try {
    return imgCtx(key);
  } catch (e) {
    return null;
  }
}

/**
 * Load a JSON file from @shell/assets.
 *
 * @param {string} path - Path like '~shell/assets/brand/suse/metadata.json'
 * @returns {object|null} The parsed JSON data or null
 */
export function requireJson(path) {
  if (!jsonCtx) {
    return null;
  }

  const key = toContextKey(path);

  try {
    const mod = jsonCtx(key);

    return mod.default || mod;
  } catch (e) {
    return null;
  }
}
