/**
 * Utility to replace dynamic require() calls for image/asset imports.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AssetContext = (key: string) => any;

function contextFrom(modules: Record<string, unknown>): AssetContext {
  return (key: string) => {
    const mod = modules[key.replace(/^\.\//, '../assets/')];

    if (mod === undefined) {
      throw new Error(`Cannot find module '${ key }'`);
    }

    return mod;
  };
}

let imgCtx: AssetContext | null = contextFrom(import.meta.glob('../assets/**/*.{svg,png,jpg,jpeg,gif,ico,webp}', {
  eager: true, query: '?url', import: 'default'
}));
let jsonCtx: AssetContext | null = contextFrom(import.meta.glob(['../assets/**/*.json', '!../assets/licenses/**'], { eager: true }));

/**
 * Convert an asset path to a context key.
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

// Expose asset resolvers on window so extension builds (which use a stub
// instead of require.context) can delegate to the host dashboard at runtime.
if (typeof window !== 'undefined') {
  (window as any).__shell_requireAsset = requireAsset;
  (window as any).__shell_requireJson = requireJson;
}

// Exported for testing — allows injecting mock contexts
export function _setContexts(img: AssetContext | null, json: AssetContext | null): void {
  imgCtx = img;
  jsonCtx = json;
}
