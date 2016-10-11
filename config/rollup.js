import replace from 'rollup-plugin-replace'
import buble from 'rollup-plugin-buble'
import uglify from 'rollup-plugin-uglify'
import filesize from 'rollup-plugin-filesize'

// use `require` MUST!
const pkg = require('../package.json')

const {env} = process.env

const entryMap = {
  dev:  'src/natty-fetch.js',
  prod: 'src/natty-fetch.js',
  test: 'test/index.spec.js',
}

const destMap = {
  dev:  'dist/natty-fetch.min.js',
  prod: 'dist/natty-fetch.min.js',
  test: 'test/bundle.js',
}

const formatMap = {
  dev:  'umd',
  prod: 'umd',
  test: 'iife',
}

export default {
  entry: entryMap[env],
  dest: destMap[env],
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
      'process.env.NODE_ENV': '"development"',
      __AJAX__: 'ajax',
      __JSONP__: 'jsonp',
      __FALLBACK__: 'true',
      __VERSION__: pkg.version,
      __ONLY_FOR_MODERN_BROWSER__: 'true',
    }),
    uglify({
      compress: {
        drop_debugger: false,
      }
    }),
    filesize(),
  ],
  sourceMap: true,
  // fixme: Rollup bug, this line does NOT work!
  banner: '/*! natty-fetch.min.js v' + pkg.version + ' | MIT License | https://github.com/jias/natty-fetch */',
}

