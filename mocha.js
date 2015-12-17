require('babel-register')({
  presets: [
    'es2015',
    'stage-0',
    'stage-1',
    'stage-2',
    'stage-3'
  ],
  plugins: [
    'transform-runtime',
    'transform-decorators-legacy',
    'babel-plugin-rewire',
  ]
})
