const { defineConfig } = require('vite');
const { createShellViteConfig } = require('./shell/vite.config');

const defaultExcludes = 'rancher-components, harvester';
const rancherEnv = process.env.RANCHER_ENV || 'web';

let excludes = process.env.EXCLUDES_PKG || defaultExcludes;

if (rancherEnv === 'harvester') {
  excludes = excludes.replace(', harvester', '');
}

module.exports = defineConfig(
  createShellViteConfig(__dirname, { excludes: excludes.replace(/\s/g, '').split(',') })
);
