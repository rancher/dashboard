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
let assetModules: Record<string, string> = import.meta.glob(
  '@shell/assets/**/*.{svg,png,jpg,jpeg,gif,ico,webp}',
  {
    eager: true, query: '?url', import: 'default'
  }
);

/**
 * Convert an asset path to a normalized key.
 *
 * Input:  '~shell/assets/images/providers/aws.svg' or '@shell/assets/images/providers/aws.svg'
 * Output: '/shell/assets/images/providers/aws.svg'
 */
export function toContextKey(path: string): string {
  return path
    .replace(/^~shell\//, '/shell/')
    .replace(/^@shell\//, '/shell/');
}

/**
 * Look up an image asset URL by path, similar to Webpack's require() for images.
 *
 * Accepts paths with ~shell/ or @shell/ prefix.
 * Throws if the asset is not found (matching the original require() behavior),
 * so callers can use try/catch for fallback logic.
 */
export function requireAsset(path: string): string {
  const normalized = toContextKey(path);

  if (assetModules[normalized]) {
    return assetModules[normalized];
  }

  throw new Error(`Asset not found: ${ path }`);
}

// Load JSON metadata files (brand metadata, etc.)
let metadataModules: Record<string, { default?: object }> = import.meta.glob(
  '@shell/assets/brand/**/metadata.json',
  { eager: true }
);

/**
 * Load a brand metadata.json file, similar to Webpack's require() for JSON.
 *
 * Throws if the JSON file is not found (matching the original require() behavior),
 * so callers can use try/catch for fallback logic.
 */
export function requireJson(path: string): object {
  const normalized = toContextKey(path);

  const mod = metadataModules[normalized];

  if (mod) {
    return mod.default || mod;
  }

  throw new Error(`JSON asset not found: ${ path }`);
}

// Exported for testing — allows injecting mock contexts
export function _setContexts(img: Record<string, string> | null, json: Record<string, { default?: object }> | null): void {
  assetModules = img || {};
  metadataModules = json || {};
}
