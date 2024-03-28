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

  const plugins = ['@babel/plugin-transform-nullish-coalescing-operator'];

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
