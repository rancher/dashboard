/**
 * Utility to replace dynamic require() calls for image/asset imports.
 *
 * In Webpack, require('~shell/assets/images/foo.svg') returned the asset URL.
 * In Vite, we use import.meta.glob with ?url query to achieve the same result.
 *
 * Note: import.meta.glob resolves aliases but returns keys as paths relative
 * to the project root (e.g. '/shell/assets/...'), not with the alias prefix.
 */

// Eagerly load all image assets as URL strings
const assetModules = import.meta.glob(
  '@shell/assets/**/*.{svg,png,jpg,jpeg,gif,ico,webp}',
  {
    eager: true, query: '?url', import: 'default'
  }
);

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
  // Normalize to /shell/ prefix to match glob key format
  const normalized = path
    .replace(/^~shell\//, '/shell/')
    .replace(/^@shell\//, '/shell/');

  if (assetModules[normalized]) {
    return assetModules[normalized];
  }

  return null;
}

// Load JSON metadata files (brand metadata, etc.)
const metadataModules = import.meta.glob(
  '@shell/assets/brand/**/metadata.json',
  { eager: true }
);

/**
 * Load a brand metadata.json file, similar to Webpack's require() for JSON.
 *
 * @param {string} path - Path like '~shell/assets/brand/suse/metadata.json'
 * @returns {object|null} The parsed JSON data or null
 */
export function requireBrandMetadata(path) {
  const normalized = path
    .replace(/^~shell\//, '/shell/')
    .replace(/^@shell\//, '/shell/');

  const mod = metadataModules[normalized];

  if (mod) {
    return mod.default || mod;
  }

  return null;
}
