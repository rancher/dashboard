import path from 'path';

const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  extends: path.resolve(__dirname, './.shell/pkg/vue.config'),
  module:  {
    rules: [
      {
        test: /\.css$/,
        use:  ['style-loader', 'css-loader'],
      },
      {
        test: /\.ttf$/,
        use:  ['babel-loader'],
      },
    ],
  },
  plugins: [new MonacoWebpackPlugin()],
};
