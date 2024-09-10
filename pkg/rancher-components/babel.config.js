module.exports = {
  presets: [
    [
      '@vue/cli-plugin-babel/preset',
      { useBuiltIns: false }
    ],
    [
      '@babel/preset-env',
      { targets: { node: 'current' } }
    ]
  ],
};
