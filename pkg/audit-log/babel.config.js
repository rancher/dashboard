module.exports = {
  ...require('./.shell/pkg/babel.config.js'),
  plugins: [
    [
      'import',
      {
        libraryName: 'vxe-table',
        style:       true // 样式是否也按需加载
      }
    ]
  ]
};
