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

// --- Webpack: require.context type declarations ---

interface WebpackRequireContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (key: string): any;
  keys(): string[];
  resolve(key: string): string;
  id: string;
}

// --- Webpack: require.context (compile-time transform) ---

let imgCtx: WebpackRequireContext | null = null;
let jsonCtx: WebpackRequireContext | null = null;

try {
  // @ts-expect-error — require.context is a webpack compile-time transform, not visible to TypeScript
  imgCtx = require.context('@shell/assets', true, /\.(svg|png|jpe?g|gif|ico|webp)$/);
} catch (e) {}

try {
  // @ts-expect-error — require.context is a webpack compile-time transform, not visible to TypeScript
  jsonCtx = require.context('@shell/assets', true, /\.json$/);
} catch (e) {}

/**
 * Convert an asset path to a require.context key.
 *
 * Input:  '~shell/assets/images/providers/aws.svg' or '@shell/assets/images/providers/aws.svg'
 * Output: './images/providers/aws.svg'
 */
export function toContextKey(path: string): string {
  return `./${ path.replace(/^[~@]shell\/assets\//, '') }`;
}

/**
 * Look up an image asset URL by path, similar to Webpack's require() for images.
 *
 * Accepts paths with ~shell/ or @shell/ prefix.
 * Throws if the asset is not found (matching the original require() behavior),
 * so callers can use try/catch for fallback logic.
 */
export function requireAsset(path: string): string {
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
 */
export function requireJson(path: string): object {
  if (!jsonCtx) {
    // Throw to match original require() behavior — callers rely on try/catch for fallback logic
    throw new Error(`JSON context not available for: ${ path }`);
  }

  const key = toContextKey(path);
  const mod = jsonCtx(key);

  return mod.default || mod;
}

// Exported for testing — allows injecting mock contexts
export function _setContexts(img: WebpackRequireContext | null, json: WebpackRequireContext | null): void {
  imgCtx = img;
  jsonCtx = json;
}
