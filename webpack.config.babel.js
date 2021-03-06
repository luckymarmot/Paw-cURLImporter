import webpack from 'webpack'
import path from 'path'

const name = 'cURLImporter'

const production = process.env.NODE_ENV === 'production'

const config = {
  target: 'node-webkit',
  entry: './src/CurlImporter.js',
  output:{
    path: path.join(__dirname, './dist/com.luckymarmot.PawExtensions.cURLImporter'),
    pathInfo: true,
    publicPath: '/dist/',
    filename: `${name}.js`
  },
  module: {
    loaders: [
      {
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, 'src'),
        ],
        test: /\.jsx?$/,
      }
    ]
  }
}
module.exports = config
