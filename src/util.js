const doc = document;

let noop = (v) => {
    return v;
};
/**
 * 对象扩展
 * @param  {Object} receiver
 * @param  {Object} supplier
 * @return {Object} 扩展后的receiver对象
 */
let extend = (receiver = {}, supplier = {}) => {
    for (let key in supplier) {
        // `supplier`中不是未定义的键 都可以执行扩展
        if (supplier.hasOwnProperty(key) && supplier[key] !== undefined) {
            receiver[key] = supplier[key];
        }
    }
    return receiver;
};

/**
 * 变换两个参数的函数到多个参数
 * @param  {Function} fn 基函数
 * @return {Function} 变换后的函数
 * @demo
 *      function add(x, y) { return x+y; }
 *      add = redo(add);
 *      add(1,2,3) => 6
 */
let redo =(fn) => {
    return function () {
        var args = arguments;
        var ret = fn(args[0], args[1]);
        for (var i = 2, l = args.length; i < l; i++) {
            ret = fn(ret, args[i]);
        }
        return ret;
    }
};

const random = Math.random;
const floor = Math.floor;
let makeRandom = () => {
    return floor(random() * 9e9);
};

// 给URL追加查询字符串
const escape = encodeURIComponent;
let appendQueryString = (url, obj, cache) => {
    let kv = [];

    // 是否追加noCache参数
    !cache && kv.push('noCache=' + makeRandom());

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            kv.push(escape(key) + '=' + escape(obj[key]));
        }
    }

    if (kv.length) {
        return url + (~url.indexOf('?') ? '&' : '?') + kv.join('&');
    } else {
        return url;
    }
};

const absoluteUrlReg = /^(https?:)?\/\//;
let isAbsoluteUrl = (url) => {
    return !!url.match(absoluteUrlReg);
};

const relativeUrlReg = /^[\.\/]/;
let isRelativeUrl = (url) => {
    return !!url.match(relativeUrlReg);
};

const BOOLEAN = 'boolean';
let isBoolean = (v) => {
    return typeof v === BOOLEAN;
};

const FUNCTION = 'function';
let isFunction = (v) => {
    return typeof v === FUNCTION;
};

let runAsFn = (v, options) => {
    return isFunction(v) ? v(options) : v;
};

const NUMBER = 'number';
let isNumber = (v) => {
    return !isNaN(v) && typeof v === NUMBER;
};

let isArray = Array.isArray;
if (__BUILD_FALLBACK__) {
    if (!isArray) {
        const toString = Object.prototype.toString;
        const ARRAY_TYPE = '[object Array]';
        isArray = (v) => {
            return toString.call(v) === ARRAY_TYPE;
        };
    }
}

// 判断是否跨域
let originA = doc.createElement('a');
originA.href = window.location.href;
let isCrossDomain = (url) => {
    let requestA = doc.createElement('a');
    requestA.href = url;
    return (originA.protocol + '//' + originA.host) !== (requestA.protocol + '//' + requestA.host);
};

module.exports = {
    extend: redo(extend),
    makeRandom,
    appendQueryString,
    noop,
    isCrossDomain,
    isAbsoluteUrl,
    isRelativeUrl,
    isBoolean,
    isFunction,
    isNumber,
    isArray,
    runAsFn
};