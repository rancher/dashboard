const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const VirtualModulesPlugin = require('webpack-virtual-modules');
const { generateTypeImport } = require('./auto-import');

module.exports = function(dir) {
  const maindir = path.resolve(dir, '..', '..');
  // The shell code must be sym-linked into the .shell folder
  const SHELL = path.join(dir, '.shell');
  let COMPONENTS_DIR = path.join(SHELL, 'rancher-components');

  if (fs.existsSync(path.join(maindir, 'shell'))) {
    COMPONENTS_DIR = path.join(maindir, 'pkg', 'rancher-components', 'src', 'components');
  }

  return {
    css: {
      // Inclue the css with the javascript, rather than having separate CSS files
      extract:       false,
      loaderOptions: { sass: { additionalData: `@use 'sass:math'; @import '${ SHELL }/assets/styles/base/_variables.scss'; @import '${ SHELL }/assets/styles/base/_functions.scss'; @import '${ SHELL }/assets/styles/base/_mixins.scss'; ` } }
    },

    chainWebpack: (context) => {
      // Add in the webpack-bundle-analyzer so we can see what is included in the bundles that are generated
      const options = {
        analyzerMode: 'static',
        openAnalyzer: false,
      };

      context
        .plugin('webpack-bundle-analyzer')
        .use(BundleAnalyzerPlugin)
        .init(Plugin => new Plugin(options));
    },

    configureWebpack: (config) => {
      // Alias updates
      config.resolve.alias['@shell'] = path.join(dir, '.shell');
      config.resolve.alias['~shell'] = path.join(dir, '.shell');
      // This should be udpated once we move to rancher-components as a dependency
      config.resolve.alias['@components'] = COMPONENTS_DIR;
      config.resolve.alias['./node_modules'] = path.join(maindir, 'node_modules');
      config.resolve.alias['@pkg'] = dir;
      config.resolve.alias['~pkg'] = dir;
      delete config.resolve.alias['@'];

      // Prevent the dynamic importer and the model-loader-require from importing anything dynamically - we don't want all of the
      // models etc when we build as a library
      const dynamicImporterOverride = new webpack.NormalModuleReplacementPlugin(/dynamic-importer$/, (resource) => {
        resource.request = path.join(__dirname, 'dynamic-importer.lib.js');
      });
      const modelLoaderImporterOverride = new webpack.NormalModuleReplacementPlugin(/model-loader-require$/, (resource) => {
        const fileName = 'model-loader-require.lib.js';
        const pkgModelLoaderRequire = path.join(dir, fileName);

        resource.request = fs.existsSync(pkgModelLoaderRequire) ? pkgModelLoaderRequire : path.join(__dirname, fileName);
      });

      // Auto-generate module to import the types (model, detail, edit etc)
      const autoImportPlugin = new VirtualModulesPlugin({ 'node_modules/@rancher/auto-import': generateTypeImport('@pkg', dir) });

      config.plugins.unshift(dynamicImporterOverride);
      config.plugins.unshift(modelLoaderImporterOverride);
      config.plugins.unshift(autoImportPlugin);
      // config.plugins.unshift(debug);

      // These modules will be externalised and not included with the build of a package library
      // This helps reduce the package size, but these dependencies must be provided by the hosting application
      config.externals = {
        jquery:    '$',
        jszip:     '__jszip',
        'js-yaml': '__jsyaml'
      };

      // Prevent warning in log with the md files in the content folder
      config.module.rules.push({
        test:    /\.md$/,
        use:  [
          {
            loader:  'url-loader',
            options: {
              name:     '[path][name].[ext]',
              limit:    1,
              esModule: false
            },
          }
        ]
      });

      // Yaml files - used for i18n translations
      config.module.rules.unshift({
        test:    /\.ya?ml$/i,
        loader:  'js-yaml-loader',
        options: { name: '[path][name].[ext]' },
      });

      // The shell code is in node_modules, so we need to make sure it will get transpiled
      // Update the webpack config to transpile @rancher/shell
      config.module.rules.forEach((p) => {
        if (p.use) {
          p.use.forEach((u) => {
            if (u.loader.includes('babel-loader')) {
              p.exclude = /node_modules\/(?!@rancher\/shell\/).*/;
            }
          });
        }
      });

      // Optimization - TODO
      // config.optimization.splitChunks = {
      //   chunks:             'async',
      //   minSize:            0,
      //   cacheGroups:        {
      //     components: {
      //       test: /components/,
      //       name(module) {
      //         // Place everything from the components folder in one chunk named 'components'
      //         const pathParts = module.context.split('/');
      //         const name = pathParts[pathParts.length - 1];
      //         const dotParts = name.split('.');

      //         return `components-${ dotParts[0] }`;
      //       },
      //     },
      //   },
      // };
    }
  };
};
