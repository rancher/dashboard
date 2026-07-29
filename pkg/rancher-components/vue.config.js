// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = {
  chainWebpack: (config) => {
    config.resolve.alias.set(
      '~',
      path.resolve(__dirname, 'src')
    );
    config.resolve.alias.set(
      '@',
      path.resolve(__dirname, '../../shell/')
    );
    config.resolve.alias.set(
      '@shell',
      path.resolve(__dirname, '../../shell/')
    );
    config.resolve.alias.set(
      '@components',
      path.resolve(__dirname, 'src/components')
    );

    // `@vue/cli-plugin-typescript` wires up `ts-loader` and `fork-ts-checker`, both of
    // which call the TypeScript compiler JS API (`readConfigFile`, `fileExists`, ...).
    // This repo's `typescript` is the native TS 7 package, which ships no JS API, so
    // both throw. Transpile with `esbuild-loader` instead - the same swap
    // `shell/vue.config.js` makes for the app/extension builds.
    //
    // `ts-loader` already ran with `transpileOnly: true`, so it never type-checked;
    // `fork-ts-checker` did, and is dropped because it cannot run without the JS API.
    // Type errors therefore no longer fail this build (`vue-tsc` covers type checking).
    ['ts', 'tsx'].forEach((ruleName) => {
      const rule = config.module.rule(ruleName);

      rule.uses.delete('ts-loader');
      // Appended last, i.e. the first loader to run - exactly where `ts-loader` sat.
      rule
        .use('esbuild-loader')
        .loader('esbuild-loader')
        .options({
          loader:   ruleName === 'tsx' ? 'tsx' : 'ts',
          target:   'esnext', // matches `target: "esnext"` in tsconfig.json; babel-loader still downlevels per browserslist
          tsconfig: path.resolve(__dirname, 'tsconfig.json'),
        });
    });

    config.plugins.delete('fork-ts-checker');
  },
  css: {
    extract:       false,
    loaderOptions: {
      sass: {
        additionalData: `
          @import "../../shell/assets/styles/base/_mixins.scss";
          @import "../../shell/assets/styles/base/_variables.scss";
        `
      }
    }
  }
};
