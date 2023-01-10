module.exports = {
  env: {
    test: {
      presets: [
        ['@babel/env', { targets: { node: 'current' } }],
        '@babel/preset-typescript'
      ]
    }
  }
};
