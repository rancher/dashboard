const { defineConfig } = require('vite');
const { createShellViteConfig } = require('@rancher/shell/vite.config');

module.exports = defineConfig(
  createShellViteConfig(__dirname, { excludes: [] })
);
