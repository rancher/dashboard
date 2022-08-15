module.exports = {
  env: {
    test: {
      presets: [['@babel/env', { targets: { node: 'current' } }]],
      plugins: [
        ['istanbul', {
          exclude: [
            '**/*.spec.js'
          ]
        }]
      ]
    },
  }
};
