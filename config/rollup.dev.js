import replace from 'rollup-plugin-replace'
import buble from 'rollup-plugin-buble'
import globals from 'rollup-plugin-node-globals'
import replacements from './rollup.replacements'

export default {
  entry: 'src/natty-fetch.js',
  dest: 'dist/natty-fetch.js',
  format: 'umd',
  moduleName: 'nattyFetch',
  external: [
      'natty-storage'
  ],
  globals: {
    'natty-storage': 'nattyStorage',
  },
  plugins: [
    buble(),
    replace(replacements),
    globals(),
  ],
  sourceMap: true,
}

