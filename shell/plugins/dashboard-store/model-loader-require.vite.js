// Vite flavour of model-loader-require. Model lookups are synchronous
// (see model-loader.js), but eagerly importing every model at module-evaluation
// time creates circular evaluation (models extend SteveModel etc. whose modules
// may still be initializing higher up the graph). Instead the models are
// preloaded asynchronously before the app boots (see shell/initialize/entry.vite.js)
// and served synchronously from a cache afterwards.
//
// This file is swapped in for model-loader-require.js by shell/vite.config.ts,
// the same pattern shell/pkg/vue.config.js uses for model-loader-require.lib.js.

const modules = import.meta.glob(['/shell/models/**/*.{js,ts}', '!**/__tests__/**', '!**/__mocks__/**', '!**/*.test.*', '!**/*.spec.*', '!**/*.d.ts']);

const cache = {};
let preloaded = false;

export async function preloadModels() {
  await Promise.all(Object.keys(modules).map(async(key) => {
    cache[key] = await modules[key]();
  }));

  preloaded = true;
}

export default function modelLoaderRequire(type) {
  const base = `/shell/models/${ type }`;
  const key = [`${ base }.js`, `${ base }.ts`].find((candidate) => candidate in modules);

  if (!key) {
    const error = new Error(`Cannot find module '@shell/models/${ type }'`);

    error.code = 'MODULE_NOT_FOUND';

    throw error;
  }

  if (!preloaded) {
    throw new Error(`Model requested before models were preloaded: ${ type }`);
  }

  return cache[key];
}
