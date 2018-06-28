const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/js/liz.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'liz-bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      }
    ]
  },
  devtool: 'source-map'
}
