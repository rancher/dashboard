module.exports = function(api) {
  api.cache(true);
  const presets = [
    [
      '@vue/cli-plugin-babel/preset',
      { useBuiltIns: false }
    ],
    [
      '@babel/preset-env',
      { targets: { node: 'current' } }
    ]
  ];
  const env = {
    test: {
      presets: [[
        '@babel/env', { targets: { node: 'current' } }
      ]]
    }
  };

  // intl-messageformat v11+ ships static class blocks (`static { … }`); the class-features
  // transform (from the vue-cli preset) needs this plugin enabled to handle them.
  const plugins = [
    '@babel/plugin-transform-nullish-coalescing-operator',
    '@babel/plugin-transform-class-static-block'
  ];

  if (process.env.NODE_ENV === 'test') {
    plugins.push('transform-require-context');
    plugins.push([
      'babel-plugin-istanbul', { extension: ['.js', '.vue'] }, 'add-vue'
    ]);
  }

  return {
    presets,
    plugins,
    env
  };
};
