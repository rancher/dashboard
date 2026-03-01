/**
 * Babel plugin to transform Vite-specific import.meta usage for Jest.
 *
 * - import.meta.glob(pattern, opts) → require('...helper')(pattern, opts, __filename)
 * - import.meta.hot                 → undefined
 * - import.meta.env                 → process.env
 *
 * The runtime helper jest-import-meta-glob.js uses fast-glob + require()
 * to resolve modules at test time, mimicking Vite's import.meta.glob.
 */
const path = require('path');

const helperPath = path.join(__dirname, 'jest-import-meta-glob.js').replace(/\\/g, '/');

module.exports = function importMetaGlobPlugin({ types: t }) {
  return {
    visitor: {
      MetaProperty(nodePath) {
        // Only handle import.meta
        if (nodePath.node.meta.name !== 'import' || nodePath.node.property.name !== 'meta') {
          return;
        }

        const parent = nodePath.parentPath;

        // import.meta.glob(pattern, opts) → require('helper')(pattern, opts, __filename)
        if (
          parent.isMemberExpression() &&
          parent.node.property.name === 'glob' &&
          parent.parentPath.isCallExpression()
        ) {
          const callPath = parent.parentPath;
          const args = callPath.node.arguments;

          callPath.replaceWith(
            t.callExpression(
              t.callExpression(
                t.identifier('require'),
                [t.stringLiteral(helperPath)]
              ),
              [
                ...args,
                t.identifier('__filename'),
              ]
            )
          );

          return;
        }

        // import.meta.hot → undefined
        if (
          parent.isMemberExpression() &&
          parent.node.property.name === 'hot'
        ) {
          parent.replaceWith(t.identifier('undefined'));

          return;
        }

        // import.meta.env → process.env
        if (
          parent.isMemberExpression() &&
          parent.node.property.name === 'env'
        ) {
          parent.replaceWith(
            t.memberExpression(
              t.identifier('process'),
              t.identifier('env')
            )
          );
        }
      }
    }
  };
};
