require('babel-register')({
  stage: 0,
  optional: [
    'es7.decorators'
  ],
  plugins: [
    'babel-plugin-rewire',
    'transform-flow-strip-types'
  ]
})
