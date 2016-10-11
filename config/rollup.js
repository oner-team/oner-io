import replace from 'rollup-plugin-replace'
import buble from 'rollup-plugin-buble'
import uglify from 'rollup-plugin-uglify'
import filesize from 'rollup-plugin-filesize'

// use `require` MUST!
const pkg = require('../package.json')

// params from package.json scripts
const {
  env, // dev | prod | test
  compat, // modern | pc
} = process.env
const isModern = compat === 'modern'

const entryMap = {
  dev: 'src/natty-fetch.js',
  prod: 'src/natty-fetch.js',
  test: 'test/index.spec.js',
}

const distFile = isModern ? 'natty-fetch.min.js' : 'natty-fetch.pc.min.js'
const destMap = {
  dev: distFile,
  prod: distFile,
  test: 'test/bundle.js',
}

const formatMap = {
  dev: 'umd',
  prod: 'umd',
  test: 'iife',
}

export default {
  entry: entryMap[env],
  dest: 'dist/' + destMap[env],
  format: formatMap[env],
  moduleName: 'nattyFetch',
  external: [
      'natty-storage'
  ],
  globals: {
    'natty-storage': 'nattyStorage',
  },
  plugins: [
    buble(),
    replace({
      __AJAX__: compat === 'modern' ? 'ajax' : 'ajax.pc',
      __JSONP__: compat === 'modern' ? 'jsonp' : 'jsonp.pc',
      __FALLBACK__: 'true',
      __VERSION__: pkg.version,
      __ONLY_FOR_MODERN_BROWSER__: 'true',
    }),
    uglify({
      compress: {
        // Do NOT drop my `debugger`
        drop_debugger: false,
      },
      output: {
        comments: function (node, comment) {
          const {value, type} = comment;

          // type = 'comment1': begin with '//'
          // type = 'comment2': begin with '/*'
          return (type === 'comment2' && value.indexOf('! natty-fetch') === 0)
        }
      }
    }),
    filesize(),
  ],
  sourceMap: true,
  banner: '/*! natty-fetch.min.js v' + pkg.version + ' | MIT License | https://github.com/jias/natty-fetch */',
}

console.log()
console.log('>', 'env=' + env, distFile)

