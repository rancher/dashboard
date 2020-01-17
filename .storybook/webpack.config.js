
const path = require('path')
module.exports = {
    module: {
        rules: [
          {
            test: /\.s?css$/,
            loaders: ['style-loader', 'css-loader', 'sass-loader'],
            include: path.resolve(__dirname, '../')
          },
          {
            test: /\.(svg|woff|woff2|ttf)$/,
            loader: "file-loader",
        }
        ]
      },
  resolve: {
    alias: {
      '@': path.dirname(path.resolve(__dirname)),
    }
  }
}