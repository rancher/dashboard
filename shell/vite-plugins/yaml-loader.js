const yaml = require('js-yaml');

/**
 * Transforms .yaml/.yml files into JS module exports.
 * Replaces js-yaml-loader from webpack config.
 */
function yamlPlugin() {
  return {
    name: 'rancher-yaml-loader',

    transform(code, id) {
      if (!/\.ya?ml$/i.test(id)) {
        return null;
      }

      try {
        const parsed = yaml.load(code);

        return {
          code: `export default ${ JSON.stringify(parsed) };`,
          map:  null,
        };
      } catch (e) {
        this.error(`Failed to parse YAML file ${ id }: ${ e.message }`);
      }
    },
  };
}

module.exports = { yamlPlugin };
