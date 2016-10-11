// use `require` MUST!
const pkg = require('../package.json')

export default {
    'process.env.NODE_ENV': '"development"',
    __AJAX__: 'ajax',
    __JSONP__: 'jsonp',
    __FALLBACK__: 'true',
    __VERSION__: pkg.version,
    __ONLY_FOR_MODERN_BROWSER__: 'true'
}