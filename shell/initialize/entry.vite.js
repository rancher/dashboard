// Vite entry point, injected into shell/public/index.html by the
// rancher:index-html plugin (shell/vite/plugins.ts).
import { preloadModels } from '@shell/plugins/dashboard-store/model-loader-require.vite';

// Models are looked up synchronously at runtime, so make sure they are all
// loaded before the application boots. This is done with dynamic imports after
// the initial module graph has evaluated, to avoid circular-evaluation errors
// (models extend base classes like SteveModel).
//
// Note: deliberately a promise chain, not top-level await. With top-level await
// this entry chunk would never finish evaluating, deadlocking the model chunks
// that share modules with it.
preloadModels()
  .then(() => import('@shell/initialize/entry'))
  .catch((e) => console.error('Failed to start the dashboard', e)); // eslint-disable-line no-console
