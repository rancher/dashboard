// Stub for extension library builds: only the dashboard's own cluster, rancher and management stores start a Steve
// web worker, never an extension's store, so the worker code is left out of extension bundles.

export default class SteveWorker {
  constructor() {
    throw new Error('A Steve web worker cannot be started from an extension');
  }
}
