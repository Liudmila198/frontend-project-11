const path = require('path');
module.exports = {
  mode: 'development', // или 'production'
  // остальные настройки...
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development', // или 'production'
}