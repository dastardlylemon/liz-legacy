const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    liz: "./src/js/liz.js",
    background: "./src/js/background.js"
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: "[name].js"
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
