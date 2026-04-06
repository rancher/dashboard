#!/usr/bin/env node

/**
 * Migration script for Rancher Dashboard extensions.
 *
 * Converts an extension project from Vue CLI (webpack) to Vite.
 *
 * Usage:
 *   npx @rancher/shell migrate-to-vite
 *   # or from the dashboard repo:
 *   node shell/scripts/migrate-extension-to-vite.js [extension-root-dir]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const targetDir = process.argv[2] && !process.argv[2].startsWith('-') ? path.resolve(process.argv[2]) : process.cwd();

// ---- Utility functions ----

function log(msg) {
  console.log(`[migrate-to-vite] ${ msg }`); // eslint-disable-line no-console
}

function warn(msg) { // eslint-disable-line no-unused-vars
  console.warn(`[migrate-to-vite] WARNING: ${ msg }`); // eslint-disable-line no-console
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath, data) {
  if (DRY_RUN) {
    log(`DRY RUN: Would write ${ filePath }`);

    return;
  }
  fs.writeFileSync(filePath, `${ JSON.stringify(data, null, 2) }\n`);
  log(`Updated ${ path.relative(targetDir, filePath) }`);
}

function writeFile(filePath, content) {
  if (DRY_RUN) {
    log(`DRY RUN: Would write ${ filePath }`);

    return;
  }
  fs.writeFileSync(filePath, content);
  log(`Created ${ path.relative(targetDir, filePath) }`);
}

function deleteFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  if (DRY_RUN) {
    log(`DRY RUN: Would delete ${ filePath }`);

    return;
  }
  fs.unlinkSync(filePath);
  log(`Deleted ${ path.relative(targetDir, filePath) }`);
}

// ---- Detection ----

function detectVueCLI(dir) {
  const pkgPath = path.join(dir, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    return false;
  }

  const pkg = readJSON(pkgPath);
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  return !!allDeps['@vue/cli-service'] || fs.existsSync(path.join(dir, 'vue.config.js'));
}

// ---- Package.json migration ----

const DEPS_TO_REMOVE = [
  '@vue/cli-service',
  '@vue/cli-plugin-babel',
  '@vue/cli-plugin-typescript',
  '@vue/cli-plugin-eslint',
  'cache-loader',
  'worker-loader',
  'css-loader',
  'style-loader',
  'babel-loader',
  'ts-loader',
  'node-polyfill-webpack-plugin',
  'webpack-virtual-modules',
  'webpack-bundle-analyzer',
  'frontmatter-markdown-loader',
  'csv-loader',
  'js-yaml-loader',
];

const DEPS_TO_ADD = {
  vite:                 '^6.0.0',
  '@vitejs/plugin-vue': '^5.0.0',
};

function migrateRootPackageJson(dir) {
  const pkgPath = path.join(dir, 'package.json');
  const pkg = readJSON(pkgPath);

  // Remove webpack-related deps
  for (const dep of DEPS_TO_REMOVE) {
    if (pkg.dependencies?.[dep]) {
      delete pkg.dependencies[dep];
    }
    if (pkg.devDependencies?.[dep]) {
      delete pkg.devDependencies[dep];
    }
  }

  // Add Vite deps
  if (!pkg.devDependencies) {
    pkg.devDependencies = {};
  }
  for (const [dep, version] of Object.entries(DEPS_TO_ADD)) {
    if (!pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep]) {
      pkg.devDependencies[dep] = version;
    }
  }

  // Update scripts
  if (pkg.scripts) {
    if (pkg.scripts.dev && pkg.scripts.dev.includes('vue-cli-service')) {
      pkg.scripts.dev = 'vite';
    }
    if (pkg.scripts.build && pkg.scripts.build.includes('vue-cli-service')) {
      pkg.scripts.build = 'vite build';
    }
    if (pkg.scripts.serve && pkg.scripts.serve.includes('vue-cli-service')) {
      pkg.scripts.serve = 'vite';
    }
    if (pkg.scripts.start && pkg.scripts.start.includes('vue-cli-service')) {
      pkg.scripts.start = 'vite preview';
    }
    if (pkg.scripts['build-pkg'] && pkg.scripts['build-pkg'].includes('vue-cli-service')) {
      // The build-pkg script typically calls the shell's build-pkg.sh which we've already updated
      log('Note: build-pkg script references vue-cli-service — the shell build-pkg.sh has been updated to use Vite');
    }
  }

  // Remove browserslist (not needed for Vite)
  delete pkg.browserslist;

  // Remove webpack-related resolutions
  if (pkg.resolutions) {
    delete pkg.resolutions['html-webpack-plugin'];
    delete pkg.resolutions['@vue/cli-service/html-webpack-plugin'];
  }

  writeJSON(pkgPath, pkg);
}

// ---- Pkg package.json migration ----

function migratePkgPackageJson(pkgDir) {
  const pkgPath = path.join(pkgDir, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    return;
  }

  const pkg = readJSON(pkgPath);

  // Remove webpack-related dev deps
  for (const dep of DEPS_TO_REMOVE) {
    if (pkg.devDependencies?.[dep]) {
      delete pkg.devDependencies[dep];
    }
  }

  // Add Vite dev deps for package build
  if (!pkg.devDependencies) {
    pkg.devDependencies = {};
  }
  for (const [dep, version] of Object.entries(DEPS_TO_ADD)) {
    pkg.devDependencies[dep] = version;
  }

  // Remove browserslist
  delete pkg.browserslist;

  writeJSON(pkgPath, pkg);
}

// ---- Vite config creation ----

function createRootViteConfig(dir) {
  const content = `const { defineConfig } = require('vite');
const { createShellViteConfig } = require('@rancher/shell/vite.config');

module.exports = defineConfig(
  createShellViteConfig(__dirname, {
    excludes: [],
  })
);
`;

  writeFile(path.join(dir, 'vite.config.js'), content);
}

function createPkgViteConfig(pkgDir) {
  const content = `const { createPkgViteConfig } = require('./.shell/pkg/vite.config');

module.exports = createPkgViteConfig(__dirname);
`;

  writeFile(path.join(pkgDir, 'vite.config.js'), content);
}

// ---- index.html creation ----

function createIndexHtml(dir) {
  const content = `<!DOCTYPE html>
<html lang="">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <link rel="shortcut icon" type="image/x-icon" href="/favicon.png">
  <title>Rancher</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/shell/initialize/entry.js"></script>
</body>
</html>
`;

  if (!fs.existsSync(path.join(dir, 'index.html'))) {
    writeFile(path.join(dir, 'index.html'), content);
  }
}

// ---- tsconfig updates ----

function updateTsConfig(dir) {
  const tsconfigPath = path.join(dir, 'tsconfig.json');

  if (!fs.existsSync(tsconfigPath)) {
    return;
  }

  const tsconfig = readJSON(tsconfigPath);

  if (!tsconfig.compilerOptions) {
    tsconfig.compilerOptions = {};
  }

  // Add vite/client types
  if (!tsconfig.compilerOptions.types) {
    tsconfig.compilerOptions.types = [];
  }
  if (!tsconfig.compilerOptions.types.includes('vite/client')) {
    tsconfig.compilerOptions.types.push('vite/client');
  }

  // Ensure ESNext module resolution
  tsconfig.compilerOptions.module = 'ESNext';
  tsconfig.compilerOptions.moduleResolution = 'Bundler';

  writeJSON(tsconfigPath, tsconfig);
}

// ---- require() to import migration in index.ts files ----

function migrateRequireToImport(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Track imports to add at the top
  const newImports = [];
  let importCounter = 0;

  // Replace: plugin.metadata = require('./package.json');
  content = content.replace(
    /plugin\.metadata\s*=\s*require\(['"]\.\/package\.json['"]\);?/g,
    () => {
      const varName = '_pkgMetadata';

      newImports.push(`import ${ varName } from './package.json';`);

      return `plugin.metadata = ${ varName };`;
    }
  );

  // Replace: plugin.metadata.icon = require('./some/path.svg');
  content = content.replace(
    /plugin\.metadata\.icon\s*=\s*require\(['"]([^'"]+)['"]\);?/g,
    (_, importPath) => {
      const varName = `_pkgIcon${ importCounter++ }`;

      newImports.push(`import ${ varName } from '${ importPath }';`);

      return `plugin.metadata.icon = ${ varName };`;
    }
  );

  // Replace: plugin.addProduct(require('./config/something'));
  content = content.replace(
    /plugin\.addProduct\(require\(['"]([^'"]+)['"]\)\)/g,
    (_, importPath) => {
      const varName = `_product${ importCounter++ }`;

      newImports.push(`import ${ varName } from '${ importPath }';`);

      return `plugin.addProduct(${ varName })`;
    }
  );

  // Replace: svg: require('./something.svg'),
  content = content.replace(
    /svg:\s*require\(['"]([^'"]+)['"]\),?/g,
    (_, importPath) => {
      const varName = `_svg${ importCounter++ }`;

      newImports.push(`import ${ varName } from '${ importPath }';`);

      return `svg: ${ varName },`;
    }
  );

  // Replace any remaining standalone require() calls
  content = content.replace(
    /(?<!\/\/.*?)require\(['"]([^'"]+)['"]\)/g,
    (match, importPath) => {
      // Skip node built-ins and already-handled patterns
      if (importPath.startsWith('.') || importPath.startsWith('@')) {
        const varName = `_imported${ importCounter++ }`;

        newImports.push(`import ${ varName } from '${ importPath }';`);

        return varName;
      }

      return match;
    }
  );

  if (content !== original && newImports.length > 0) {
    // Find the last existing import statement to insert after
    const importRegex = /^import\s+.*$/gm;
    let lastImportIndex = -1;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      lastImportIndex = match.index + match[0].length;
    }

    if (lastImportIndex >= 0) {
      content = `${ content.slice(0, lastImportIndex) }\n${ newImports.join('\n') }${ content.slice(lastImportIndex) }`;
    } else {
      content = `${ newImports.join('\n') }\n${ content }`;
    }

    if (DRY_RUN) {
      log(`DRY RUN: Would update ${ filePath }`);
    } else {
      fs.writeFileSync(filePath, content);
      log(`Migrated require() calls in ${ path.relative(targetDir, filePath) }`);
    }
  }
}

// ---- Main migration logic ----

function migrate(dir) {
  log(`Migrating extension project at: ${ dir }`);
  log('');

  if (!detectVueCLI(dir)) {
    log('No Vue CLI / webpack configuration detected. This project may already use Vite or is not a Vue CLI project.');
    log('Continuing anyway...');
  }

  // 1. Update root package.json
  log('--- Step 1: Updating root package.json ---');
  migrateRootPackageJson(dir);

  // 2. Create root vite.config.js
  log('--- Step 2: Creating vite.config.js ---');
  createRootViteConfig(dir);

  // 3. Create index.html
  log('--- Step 3: Creating index.html ---');
  createIndexHtml(dir);

  // 4. Update tsconfig.json
  log('--- Step 4: Updating tsconfig.json ---');
  updateTsConfig(dir);

  // 5. Process each pkg/* directory
  const pkgDir = path.join(dir, 'pkg');

  if (fs.existsSync(pkgDir)) {
    const packages = fs.readdirSync(pkgDir)
      .filter((name) => !name.startsWith('.') && name !== 'node_modules')
      .filter((name) => fs.statSync(path.join(pkgDir, name)).isDirectory());

    for (const pkgName of packages) {
      const pkgPath = path.join(pkgDir, pkgName);

      log(`--- Step 5: Processing pkg/${ pkgName } ---`);

      // Update package.json
      migratePkgPackageJson(pkgPath);

      // Create vite.config.js
      createPkgViteConfig(pkgPath);

      // Update tsconfig.json
      updateTsConfig(pkgPath);

      // Migrate require() calls in index.ts/index.js
      const indexTs = path.join(pkgPath, 'index.ts');
      const indexJs = path.join(pkgPath, 'index.js');

      if (fs.existsSync(indexTs)) {
        migrateRequireToImport(indexTs);
      } else if (fs.existsSync(indexJs)) {
        migrateRequireToImport(indexJs);
      }

      // Delete old vue.config.js
      deleteFile(path.join(pkgPath, 'vue.config.js'));

      // Delete old babel.config.js
      deleteFile(path.join(pkgPath, 'babel.config.js'));
    }
  }

  // 6. Delete old root vue.config.js and babel.config.js
  log('--- Step 6: Cleaning up old config files ---');
  deleteFile(path.join(dir, 'vue.config.js'));
  deleteFile(path.join(dir, 'babel.config.js'));

  log('');
  log('Migration complete!');
  log('');
  log('Next steps:');
  log('  1. Run `yarn install` or `npm install` to install new dependencies');
  log('  2. Run `yarn dev` or `npm run dev` to test the development server');
  log('  3. Run `yarn build-pkg <name>` to test building an extension');
  log('  4. Review any remaining require() calls that could not be automatically converted');
  log('');

  if (DRY_RUN) {
    log('This was a DRY RUN. No files were modified. Remove --dry-run to apply changes.');
  }
}

// ---- Run ----

migrate(targetDir);
