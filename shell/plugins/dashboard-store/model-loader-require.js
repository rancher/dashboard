/**
 * Fetch a model from the dashboard's local model's folder
 *
 * Splitting this out into a separate function means packages can
 * override this to ensure dashboard models aren't bundled with it
 *
 * Uses eager: false to avoid circular dependency issues at module
 * initialization time (model files import SteveModel which imports
 * resource-class which imports store modules).
 *
 * Call preloadModels() during app boot to resolve all modules into
 * a synchronous cache before any component renders.
 *
 * Note: import.meta.glob resolves aliases but returns keys as paths
 * relative to the project root (e.g. '/shell/models/...').
 *
 * @param {string} type
 * @returns Model module
 */
const modelModules = import.meta.glob(['@shell/models/**/*.{js,ts}', '!**/__tests__/**', '!**/*.test.{js,ts}'], { eager: false });

// Synchronous cache populated by preloadModels()
const resolvedCache = {};

/**
 * Preload all model modules into a synchronous cache.
 * Must be called (and awaited) during app initialization
 * before any component renders or store getter accesses models.
 */
export async function preloadModels() {
  const entries = Object.entries(modelModules);

  const results = await Promise.all(
    entries.map(async([key, loader]) => {
      try {
        const mod = await loader();

        return [key, mod];
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`[model-loader] Failed to preload model: ${ key }`, e);

        return null;
      }
    })
  );

  for (const result of results) {
    if (result) {
      const [key, mod] = result;

      resolvedCache[key] = mod;
    }
  }
}

export default function modelLoaderRequire(type) {
  const extensions = ['.js', '.ts'];

  for (const ext of extensions) {
    const key = `/shell/models/${ type }${ ext }`;

    if (resolvedCache[key]) {
      return resolvedCache[key];
    }
  }

  // Fallback: search by suffix in case of nested paths or different format
  const matchedKey = Object.keys(resolvedCache).find(
    (k) => k.endsWith(`/${ type }.js`) || k.endsWith(`/${ type }.ts`)
  );

  if (matchedKey) {
    return resolvedCache[matchedKey];
  }

  const err = new Error(`Model not found: ${ type }`);

  err.code = 'MODULE_NOT_FOUND';
  throw err;
}
