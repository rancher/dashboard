module.exports = { env: { test: { presets: [['@babel/env', { targets: { node: 'current' } }]], plugins: ['transform-require-context'] } } };
