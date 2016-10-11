import config from './rollup.dev'
// import commonjs from 'rollup-plugin-commonjs';
// import nodeResolve from 'rollup-plugin-node-resolve';

// import replace from 'rollup-plugin-replace'
// import replacements from './rollup.replacements'

config.entry = 'test/index.spec.js'
config.dest = 'test/bundle.js'
config.format = 'iife'
config.external = [
    'natty-fetch'
]
config.globals = {
  'natty-fetch': 'nattyFetch'
}

// config.plugins[1] = replace(Object.assign({}, replacements, {
//   'process.env.NODE_ENV': '"production"'
// }));

// config.plugins.push(nodeResolve({
//     jsnext: true,
//     main: true
// }))
//
// config.plugins.push(commonjs({
//     include: ['node_modules/**'],
//     namedExports: {
//         'node_modules/expect.js/index.js': ['expect']
//     }
// }))


export default config