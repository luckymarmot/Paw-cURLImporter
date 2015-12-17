require('babel-register')({
  presets: [
    'es2015',
    'stage-0',
    'stage-1',
    'stage-2',
    'stage-3'
  ],
  plugins: [
    'babel-plugin-rewire',
    'transform-runtime',
    'transform-decorators-legacy'
  ]
})
