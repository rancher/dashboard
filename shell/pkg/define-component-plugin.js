/**
 * Custom WebPack plugin that will detect 'defineComponent' imports from Vue and
 * replace those with references to our shim - which will either use the Vue
 * definition if avialble or it will use a fallback.
 */

const path = require('path');
const PLUGIN_NAME = 'rancherDefineComponentPlugin';

class RancherDefineComponentPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(
      PLUGIN_NAME,
      (compilation, { normalModuleFactory }) => {
        const handler = (parser) => {
          parser.hooks.program.tap(PLUGIN_NAME, (ast) => {
            // Go through the complication abstract syntax tree and look for import statements
            ast.body.forEach((node) => {
              if (node.type === 'ImportDeclaration') {
                if (node.source.value === 'vue' && node.specifiers) {
                  // When we import defineComponent in the shim, we use a different local name, which ensures we don't end up in a recursive loop
                  const isDefineComponent = node.specifiers.find((node) => node.local.name === 'defineComponent' && node.imported.name === 'defineComponent');

                  if (isDefineComponent) {
                    // Replace the import to use the shim
                    node.source.value = path.join(__dirname, 'define-component-shim.js');
                  }
                }
              }
            });
          });
        };

        normalModuleFactory.hooks.parser.for('javascript/auto').tap('UseStrictPlugin', handler);
        normalModuleFactory.hooks.parser.for('javascript/dynamic').tap('UseStrictPlugin', handler);
        normalModuleFactory.hooks.parser.for('javascript/esm').tap('UseStrictPlugin', handler);
      }
    );
  }
}

module.exports = RancherDefineComponentPlugin;
