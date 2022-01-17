const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const VirtualModulesPlugin = require('webpack-virtual-modules');
const { generateTypeImport, contextFolders, contextMap } = require('./auto-import');
// const tsConfigFile = path.resolve(dir, 'tsconfig.json');

module.exports = function(dir) {
  const maindir = path.resolve(dir, '..', '..');

  return {
    css: {
      // Inclue the css with the javascript, rather than having separate CSS files
      extract: false
    },

    chainWebpack: (context) => {
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
      config.resolve.alias['@shell'] = path.join(dir, '.shell');
      // config.resolve.alias['@'] = __dirname;
      // TODO: Check this one is needed
      config.resolve.alias['./node_modules'] = path.join(maindir, 'node_modules');

      // TODO: This can go
      config.resolve.alias['@/models'] = path.join(dir, '.shell/models');
      config.resolve.alias['~shell'] = path.join(dir, '.shell');
      config.resolve.alias['@pkg'] = dir;

      delete config.resolve.alias['@'];

      const SHELL = path.join(dir, '.shell');

      contextFolders.forEach((f) => {
        config.resolve.alias[`@/${ f }`] = path.join(dir, '.shell', f);
      });

      // const debug = new webpack.NormalModuleReplacementPlugin(/.*/, (resource) => {
      //   if (resource.request.includes('auto')) {
      //     console.log(`REQ: ${ resource.request } from ${ resource.contextInfo.issuer }`); // eslint-disable-line no-console
      //   }
      // });

      const nmrp = new webpack.NormalModuleReplacementPlugin(/^@\//, (resource) => {
        // console.log(`REQ: ${ resource.request } from ${ resource.contextInfo.issuer }`); // eslint-disable-line no-console
        const folder = resource.request.split('/')[1];

        // console.log(`>> REQ: ${ resource.request }`); // eslint-disable-line no-console

        if (contextMap[folder]) {
          resource.request = `@shell/${ resource.request.substr(2) }`;
        }
      });

      const dynamicImporterOveride = new webpack.NormalModuleReplacementPlugin(/dynamic-importer$/, (resource) => {
        resource.request = path.join(__dirname, 'dynamic-importer.lib.js');
      });

      // Auto-generate module to import the types (model, detail, edit etc)
      const autoImportPlugin = new VirtualModulesPlugin({ 'node_modules/@ranch/auto-import': generateTypeImport('@pkg', dir) });
      // Ensure that the dyanmic-importer does not import anything when used in a library
      const ctxOverride = new webpack.ContextReplacementPlugin(/^@\//, (context) => {
        const folder = context.request.split('/')[1];

        if (contextMap[folder]) {
          // Just change the regex so it does not match any resources
          context.regExp = /does-not-exist/;
        }
      });

      // TODO: Allow override of assets
      // const nmrp = new webpack.NormalModuleReplacementPlugin(/.*/, (resource) => {
      //   // console.log(`REQ: ${ resource.request } from ${ resource.contextInfo.issuer }`); // eslint-disable-line no-console
      //   console.log(`REQ: ${ resource.request }`); // eslint-disable-line no-console

      //   const corejs = '/Users/nwm/dev/monday/try4/dashboard/node_modules/core-js';

      //   if (resource.request.indexOf(corejs) === 0) {
      //     resource.request = resource.request.substr(corejs.length - 7);
      //     // console.log(resource.request); // eslint-disable-line no-console
      //   }
      // });

      config.plugins.unshift(nmrp);
      config.plugins.unshift(dynamicImporterOveride);
      config.plugins.unshift(ctxOverride);
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

      // TODO: Check to see if we can do this with the css config
      config.module.rules.forEach((rule) => {
        if ('file.scss'.match(rule.test)) {
          rule.oneOf.forEach((r) => {
            r.use.forEach((loader) => {
              if (loader.loader.includes('sass-loader')) {
                loader.options.prependData = `@use 'sass:math'; @import '${ SHELL }/assets/styles/base/_variables.scss'; @import '${ SHELL }/assets/styles/base/_functions.scss'; @import '${ SHELL }/assets/styles/base/_mixins.scss'; `;
              }
            });
          });
        } else if ('file.js'.match(rule.test)) {
          const alt = rule.oneOf || [{ use: rule.use }];

          // This can go - its does't work
          alt.forEach((r) => {
            r.use.forEach((loader) => {
              if (loader.loader.includes('babel-loader')) {
                loader.options = {
                  presets: [
                    '@vue/cli-plugin-babel/preset'
                  ]
                };
              }
            });
          });
        }
      });

      // } else if ('file.ts'.match(rule.test)) {
      //   const alt = rule.oneOf || [{ use: rule.use }];

      //   alt.forEach((r) => {
      //     r.use.forEach((loader) => {
      //       if (loader.loader.includes('ts-loader')) {
      //         loader.options.configFile = tsConfigFile;
      //       }
      //     });
      //   });
    }
  };
};
