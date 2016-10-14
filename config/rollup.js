import replace from 'rollup-plugin-replace'
// https://buble.surge.sh/guide/
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

const distFile = isModern ? 'dist/natty-fetch.min.js' : 'dist/natty-fetch.pc.min.js'
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
    buble({
      transforms: {
        // 在IE8下测试时，如果不启动下面的uglify，则需要开启buble对IE8关键字的处理
        // IE8: `.catch` to `['catch']`, `.finally` to `['finally']`
        reservedProperties: true
      }
    }),
    replace({
      __AJAX__: isModern ? 'ajax' : 'ajax.pc',
      __JSONP__: isModern ? 'jsonp' : 'jsonp.pc',
      __FALLBACK__: isModern ? 'false' : 'true',
      __VERSION__: pkg.version,
    }),
    uglify({
      compress: {
        // Do NOT drop my `debugger`
        drop_debugger: false,
        // 要兼顾到`test/bundle.js`, 开发过程中一直兼容`IE8`, 生产环境对`modern`版做优化
        // when is true: `.catch` to `['catch']`, `.finally` to `['finally']`
        screw_ie8: env === 'prod' ? isModern : false,
      },
      mangle: {
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
  banner: '/*! ' + distFile.substr(5) + ' v' + pkg.version + ' | MIT License | https://github.com/jias/natty-fetch */',
}

console.log()
console.log('>', 'env=' + env, distFile)

