// CodeMirror 6 relies on object identity across its packages (a second copy of @codemirror/state
// rejects extensions created by the first), so extensions should use the host's copy, which
// Rancher exposes as window.__codemirror (see core/plugins-loader.js). Keep the two lists in step.
//
// It can't simply be externalised: the UMD wrapper binds externals at load time, so on hosts that
// don't define window.__codemirror (Rancher versions from before CodeMirror 6) every import would
// be undefined. Instead each package is replaced with a stub that uses the host's copy when there
// is one, and otherwise falls back to a copy bundled with the extension.

const CODEMIRROR_PACKAGES = [
  '@codemirror/autocomplete',
  '@codemirror/commands',
  '@codemirror/lang-json',
  '@codemirror/lang-yaml',
  '@codemirror/language',
  '@codemirror/search',
  '@codemirror/state',
  '@codemirror/view',
  '@lezer/common',
  '@lezer/highlight',
  '@replit/codemirror-vim',
];

const STUB_MODULE = '@rancher/shared-codemirror';

/**
 * Module name of the stub that replaces the given package
 */
function stubModule(pkg) {
  return `${ STUB_MODULE }/${ pkg.replace('/', '__') }.js`;
}

/**
 * Source of the stub that replaces the given package
 */
function stubSource(pkg) {
  return [
    `var host = typeof window !== 'undefined' && window.__codemirror && window.__codemirror[${ JSON.stringify(pkg) }];`,
    '',
    `module.exports = host || require(${ JSON.stringify(pkg) });`,
    '',
  ].join('\n');
}

/**
 * Virtual modules, keyed by path, for every stub
 */
function stubModules() {
  return CODEMIRROR_PACKAGES.reduce((modules, pkg) => {
    modules[`node_modules/${ stubModule(pkg) }`] = stubSource(pkg);

    return modules;
  }, {});
}

/**
 * The stub to replace the given module request with, or undefined if it isn't a shared package.
 * Requests from the stubs themselves load the real package
 */
function replacementFor(request, issuer = '') {
  if (!CODEMIRROR_PACKAGES.includes(request) || issuer.includes(STUB_MODULE)) {
    return undefined;
  }

  return stubModule(request);
}

module.exports = {
  CODEMIRROR_PACKAGES, stubSource, stubModules, replacementFor
};
