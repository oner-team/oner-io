/**
 * rollup config
 *
 * @license MIT License
 * @author jias (https://github.com/jias/natty-fetch)
 * @note `node`还不支持`import`
 */
const rollup = require('rollup')
const replace = require('rollup-plugin-replace')
const buble = require('rollup-plugin-buble')
const uglify = require('rollup-plugin-uglify')
const filesize = require('rollup-plugin-filesize')
const pkg = require('../package.json')

const argv = require('minimist')(process.argv.slice(2));

// params from package.json scripts
const {
  env, // dev | prod | test
} = argv

const entryMap = {
  dev: 'src/natty-fetch.js',
  prod: 'src/natty-fetch.js',
  test: 'test/index.spec.js',
}

const formatMap = {
  dev: 'umd',
  prod: 'umd',
  test: 'iife',
}

// 构建，同时构建压缩和非压缩两个版本
// 注意，目前dev和prod的构建内容一模一样，没有dev环境的log信息
if (env === 'dev' || env === 'prod') {
  buildNattyFetch(true, false).then(function () {
    console.log('`natty-fetch.js` was builded.\n')
    return buildNattyFetch(true, true)
  }).then(function () {
    console.log('`natty-fetch.min.js` was builded.\n')
    return buildNattyFetch(false, false)
  }).then(function () {
    console.log('`natty-fetch.pc.js` was builded.\n')
    return buildNattyFetch(false, true)
  }).then(function () {
    console.log('`natty-fetch.pc.min.js` was builded.\n')
  })
}

// 测试构建，只构建单测脚本，无需压缩
else if (env === 'test') {
  buildTestBundle().then(function () {
    console.log('`test/bundle.js` was builded.\n')
  })
}


/**
 * 构建`natty-fetch`
 * @param isModern {Boolean} 是否是`Morder Browser`版本，如果是false，最低兼容到`IE8`
 * @param isUgly {Boolean} 是否压缩
 * @returns {Object} Promise instance
 */
function buildNattyFetch(isModern, isUgly) {
  return rollup.rollup({
    entry: entryMap[env],
    external: [
      'natty-storage'
    ],
    plugins: (function(){
      return [
        buble({
          transforms: {
            // 在IE8下测试时，如果不启动下面的uglify，则需要开启buble对IE8关键字的处理
            // IE8: `.catch` to `['catch']`, `.finally` to `['finally']`
            // reservedProperties: true
          }
        }),
        replace({
          __AJAX__: isModern ? 'ajax' : 'ajax.pc',
          __JSONP__: isModern ? 'jsonp' : 'jsonp.pc',
          __FALLBACK__: isModern ? 'false' : 'true',
          __VERSION__: pkg.version,
        }),
        isUgly ? uglify({
          compress: {
            // Do NOT drop my `debugger`
            drop_debugger: false,
            // 是否抛弃IE8？目前还不能啊！
            // when is false: `.catch` to `['catch']`, `.finally` to `['finally']`
            // 如果是modern，应该是true，否则false
            screw_ie8: env === 'prod' ? isModern : false,
          },
          mangle: {},
          output: {
            comments: function (node, comment) {
              const {value, type} = comment;

              // type = 'comment1': begin with '//'
              // type = 'comment2': begin with '/*'
              return (type === 'comment2' && value.indexOf('! natty-fetch') === 0)
            }
          }
        }) : null,
        filesize(),
      ].filter(function (item) {
        return !!item
      })
    })()
  }).then(function (bundle) {

    const distFile = [
      'dist/natty-fetch',
      isModern ? '' : '.pc',
      isUgly ? '.min' : '',
      '.js'
    ].filter(function (str) {
      return !!str
    }).join('')

    return bundle.write({
      format: formatMap[env],
      dest: distFile,
      moduleName: 'nattyFetch',
      globals: {
        'natty-storage': 'nattyStorage',
      },
      sourceMap: true,
      banner: '/*! ' + distFile.substr(5) + ' v' + pkg.version + ' | MIT License | https://github.com/jias/natty-fetch */',
    })
  })
}


/**
 * 构建单测脚本
 * @return {Object} Promise instance
 */
function buildTestBundle() {
  return rollup.rollup({
    entry: entryMap[env],
    plugins: [
      buble({
        transforms: {
          // 在IE8下测试时，如果不启动下面的uglify，则需要开启buble对IE8关键字的处理
          // IE8: `.catch` to `['catch']`, `.finally` to `['finally']`
          reservedProperties: false
        }
      }),
      replace({
        __VERSION__: pkg.version,
      }),
      uglify({
        compress: {
          // Do NOT drop my `debugger`
          drop_debugger: false,
          // 是否抛弃IE8？目前还不能啊！
          // when is false: `.catch` to `['catch']`, `.finally` to `['finally']`
          // 如果是modern，应该是true，否则false
          screw_ie8: false,
        },
        mangle: {}
      })
    ]
  }).then(function (bundle) {
    return bundle.write({
      format: formatMap[env],
      dest: 'test/bundle.js',
      sourceMap: true,
    })
  })
}

