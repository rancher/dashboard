// Stub for extension library builds — prevents require.context() from bundling
// all shell images into every extension. At runtime, delegates to the host
// dashboard's asset resolver (exposed on window by the real require-asset.ts).

export function toContextKey(path) {
  return `./${ path.replace(/^[~@]shell\/assets\//, '') }`;
}

export function requireAsset(path) {
  if (typeof window !== 'undefined' && window.__shell_requireAsset) {
    return window.__shell_requireAsset(path);
  }

  throw new Error(`Asset context not available for: ${ path }`);
}

export function requireJson(path) {
  if (typeof window !== 'undefined' && window.__shell_requireJson) {
    return window.__shell_requireJson(path);
  }

  throw new Error(`JSON context not available for: ${ path }`);
}

export function _setContexts() {}
