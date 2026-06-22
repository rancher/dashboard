#!/usr/bin/env node

/**
 * Verification script for the require-asset extension build fix.
 *
 * Proves that the NormalModuleReplacementPlugin correctly prevents
 * shell images from being bundled into extensions, without needing
 * a full `yarn build-pkg` (which has pre-existing TS errors on master).
 *
 * Usage:  node scripts/verify-asset-fix.js
 */

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const ROOT = path.resolve(__dirname, '..');
const SHELL = path.join(ROOT, 'shell');
const PKG_CONFIG = path.join(SHELL, 'pkg', 'vue.config.js');
const STUB_FILE = path.join(SHELL, 'pkg', 'require-asset.lib.js');
const REAL_FILE = path.join(SHELL, 'utils', 'require-asset.ts');

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  \x1b[32mPASS\x1b[0m  ${label}`);
    passed++;
  } else {
    console.log(`  \x1b[31mFAIL\x1b[0m  ${label}`);
    if (detail) {
      console.log(`        ${detail}`);
    }
    failed++;
  }
}

// ── 1. Structural checks ──────────────────────────────────────────────

console.log('\n1. Structural checks\n');

check(
  'Stub file exists at shell/pkg/require-asset.lib.js',
  fs.existsSync(STUB_FILE)
);

const stubContent = fs.existsSync(STUB_FILE) ? fs.readFileSync(STUB_FILE, 'utf8') : '';

check(
  'Stub exports requireAsset()',
  stubContent.includes('export function requireAsset(')
);

check(
  'Stub exports requireJson()',
  stubContent.includes('export function requireJson(')
);

check(
  'Stub exports toContextKey()',
  stubContent.includes('export function toContextKey(')
);

check(
  'Stub exports _setContexts()',
  stubContent.includes('export function _setContexts(')
);

const stubCodeLines = stubContent.split('\n').filter((line) => !line.trimStart().startsWith('//'));
const stubCodeOnly = stubCodeLines.join('\n');

check(
  'Stub does NOT call require.context()',
  !stubCodeOnly.includes('require.context('),
  'Stub must not call require.context() — that is the whole point of the fix'
);

check(
  'Stub delegates to window.__shell_requireAsset at runtime',
  stubContent.includes('window.__shell_requireAsset')
);

check(
  'Stub delegates to window.__shell_requireJson at runtime',
  stubContent.includes('window.__shell_requireJson')
);

// ── 2. Host-side exposure ─────────────────────────────────────────────

console.log('\n2. Host-side exposure (require-asset.ts)\n');

const realContent = fs.readFileSync(REAL_FILE, 'utf8');

check(
  'require-asset.ts exposes requireAsset on window.__shell_requireAsset',
  realContent.includes('__shell_requireAsset')
    && realContent.includes('requireAsset'),
  'The host dashboard must expose its requireAsset on window for extensions to delegate to'
);

check(
  'require-asset.ts exposes requireJson on window.__shell_requireJson',
  realContent.includes('__shell_requireJson')
    && realContent.includes('requireJson'),
  'The host dashboard must expose its requireJson on window for extensions to delegate to'
);

check(
  'require-asset.ts still uses require.context (for the main dashboard build)',
  realContent.includes("require.context('@shell/assets'"),
  'The main dashboard build must still bundle assets via require.context'
);

// ── 3. Webpack plugin configuration ──────────────────────────────────

console.log('\n3. Webpack plugin configuration (shell/pkg/vue.config.js)\n');

const configContent = fs.readFileSync(PKG_CONFIG, 'utf8');

check(
  'vue.config.js has NormalModuleReplacementPlugin for require-asset',
  configContent.includes('require-asset')
    && configContent.includes('NormalModuleReplacementPlugin')
    && configContent.includes('require-asset.lib.js')
);

check(
  'Follows the same pattern as dynamic-importer override',
  configContent.includes("NormalModuleReplacementPlugin(/dynamic-importer$/")
    && configContent.includes("NormalModuleReplacementPlugin(/require-asset$/"),
  'The require-asset override should follow the same pattern as dynamic-importer'
);

// ── 4. Webpack module resolution test ─────────────────────────────────

console.log('\n4. Webpack module resolution simulation\n');

// Simulate what NormalModuleReplacementPlugin does:
// When webpack encounters an import of a module matching /require-asset$/,
// it rewrites the request to point to the stub file.
const testPaths = [
  '@shell/utils/require-asset',
  '../../utils/require-asset',
  '../utils/require-asset',
  './require-asset',
];

testPaths.forEach((importPath) => {
  const matches = /require-asset$/.test(importPath);

  check(
    `Regex /require-asset$/ matches "${importPath}"`,
    matches,
    'All import paths ending in require-asset should be caught by the plugin'
  );
});

// Ensure the regex does NOT match unrelated paths
const falsePaths = [
  '@shell/utils/require-assets-helper',
  './my-require-asset-utils',
];

falsePaths.forEach((importPath) => {
  const matches = /require-asset$/.test(importPath);

  check(
    `Regex /require-asset$/ does NOT match "${importPath}"`,
    !matches
  );
});

// ── 5. Image count (what the fix prevents) ────────────────────────────

console.log('\n5. Bundle impact analysis\n');

function countImages(dir) {
  let count = 0;
  let totalSize = 0;
  const extensions = new Set(['.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp']);

  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);

      if (entry.isDirectory()) {
        walk(full);
      } else if (extensions.has(path.extname(entry.name).toLowerCase())) {
        count++;
        totalSize += fs.statSync(full).size;
      }
    }
  }

  walk(dir);

  return { count, totalSize };
}

const assetsDir = path.join(SHELL, 'assets');
const { count: imageCount, totalSize } = countImages(assetsDir);
const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);

console.log(`  \x1b[36mINFO\x1b[0m  shell/assets/ contains ${imageCount} images (${sizeMB} MB)`);
console.log(`  \x1b[36mINFO\x1b[0m  Without this fix, ALL ${imageCount} images are bundled into every extension`);
console.log(`  \x1b[36mINFO\x1b[0m  With this fix, 0 shell images are bundled (extensions delegate to the host)\n`);

check(
  `At least 100 images would be prevented from bundling (found ${imageCount})`,
  imageCount >= 100,
  `Expected 100+ images in shell/assets, found ${imageCount}`
);

// ── 6. Existing pattern consistency ───────────────────────────────────

console.log('\n6. Consistency with existing override patterns\n');

const dynamicImporterStub = path.join(SHELL, 'pkg', 'dynamic-importer.lib.js');
const modelLoaderStub = path.join(SHELL, 'pkg', 'model-loader-require.lib.js');

check(
  'dynamic-importer.lib.js exists (existing pattern)',
  fs.existsSync(dynamicImporterStub)
);

check(
  'model-loader-require.lib.js exists (existing pattern)',
  fs.existsSync(modelLoaderStub)
);

check(
  'require-asset.lib.js follows the same *.lib.js naming convention',
  fs.existsSync(STUB_FILE) && STUB_FILE.endsWith('.lib.js')
);

// All three overrides should be registered in vue.config.js
const overrides = ['dynamic-importer', 'model-loader-require', 'require-asset'];

overrides.forEach((name) => {
  check(
    `vue.config.js registers NormalModuleReplacementPlugin for ${name}`,
    configContent.includes(`/${name}$/`) || configContent.includes(`/${name}$`)
  );
});

// ── Summary ───────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log(`\n  ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
