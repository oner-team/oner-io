const hasWindow = 'undefined' !== typeof window;
const doc = hasWindow ? document : null;
const escape = encodeURIComponent;
const NULL = null;
const toString = Object.prototype.toString;
const ARRAY_TYPE = '[object Array]';
const OBJECT_TYPE = '[object Object]';

/**
 * 判断是否是IE8~11, 不包含Edge
 * @returns {boolean}
 * @note IE11下 window.ActiveXObject的值很怪异, 所有需要追加 'ActiveXObject' in window 来判断
 */
const isIE = hasWindow && (!!window.ActiveXObject || 'ActiveXObject' in window);

let noop = (v) => {
    return v;
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

let runAsFn = (v) => {
    return isFunction(v) ? v() : v;
};

const NUMBER = 'number';
let isNumber = (v) => {
    return !isNaN(v) && typeof v === NUMBER;
};

const OBJECT = 'object';
let isObject = (v) => {
    return typeof v === OBJECT;
};

let isWindow = (v) => {
    return v !== NULL && v === v.window;
};

// 参考了zepto
let isPlainObject = (v) => {
    return v !== NULL && isObject(v) && !isWindow(v) && Object.getPrototypeOf(v) === Object.prototype;
};

let isArray = Array.isArray;
if (__BUILD_FALLBACK__) {
    if (!isArray) {
        isArray = (v) => {
            return toString.call(v) === ARRAY_TYPE;
        };
    }
}



/**
 * 判断是否跨域
 * @type {Element}
 * @note 需要特别关注IE8~11的行为是不一样的!!!
 */
let originA;
if(doc) {
    originA = doc.createElement('a');
    originA.href = location.href;
}
let isCrossDomain = (url) => {

    let requestA = doc.createElement('a');
    requestA.href = url;
    //console.log(originA.protocol + '//' + originA.host + '\n' + requestA.protocol + '//' + requestA.host);

    // 如果`url`的值不包含`protocol`和`host`(比如相对路径), 在标准浏览器下, 会自定补全`requestA`对象的`protocal`和`host`属性.
    // 但在IE8~11下, 不会自动补全. 即`requestA.protocol`和`requestA.host`的值都是空的.
    // 在IE11的不同小版本下, requestA.protocol的值有的是`:`, 有的是空字符串, 太奇葩啦!
    if (__BUILD_FALLBACK__) {
        if (isIE && (requestA.protocol === ':' || requestA.protocol === '')) {
            if (requestA.hostname === '') {
                //alert(0)
                return false;
            } else {
                //alert('1:'+(originA.hostname !== requestA.hostname || originA.port !== requestA.port))
                return originA.hostname !== requestA.hostname || originA.port !== requestA.port;
            }
        }
    }

    //let log = {
    //    'originA.hostname': originA.hostname,
    //    'requestA.hostname': requestA.hostname,
    //    'originA.port': originA.port,
    //    'requestA.port': requestA.port,
    //    'originA.protocol': originA.protocol,
    //    'requestA.protocol': requestA.protocol
    //}
    //
    //alert(JSON.stringify(log));

    // 标准浏览器
    return originA.hostname !== requestA.hostname || originA.port !== requestA.port || originA.protocol !== requestA.protocol;
};

/**
 * 对象扩展
 * @param  {Object} receiver
 * @param  {Object} supplier
 * @return {Object} 扩展后的receiver对象
 * @note 这个extend方法是定制的, 不要拷贝到其他地方用!!!
 */
let extend = (receiver = {}, supplier = {}) => {
    for (let key in supplier) {
        // `supplier`中不是未定义的键 都可以执行扩展
        if (supplier.hasOwnProperty(key) && supplier[key] !== undefined) {
            if (isArray(supplier[key])) {
                receiver[key] = [].concat(supplier[key]);
            } else if (isPlainObject(supplier[key])) {
                receiver[key] = extend({}, supplier[key]);
            } else {
                receiver[key] = supplier[key];
            }
        }
    }
    return receiver;
};

let likeArray = (v) => {
    if (!v) {
        return false;
    }
    return typeof v.length === NUMBER;
};

/**
 *
 * @param v {Array|Object} 遍历目标对象
 * @param fn {Function} 遍历器 会被传入两个参数, 分别是`value`和`key`
 */
let each = (v, fn) => {
    let i, l;
    if (likeArray(v)) {
        for (i = 0, l = v.length; i < l; i++) {
            if (fn.call(v[i], v[i], i) === false) return;
        }
    } else {
        for (i in v) {
            if (fn.call(v[i], v[i], i) === false) return;
        }
    }
};

//
let serialize = (params, obj, traditional, scope) => {
    let type, array = isArray(obj), hash = isPlainObject(obj);
    each(obj, function(value, key) {
        type = toString.call(value);
        if (scope) {
            key = traditional ? scope : scope + '[' + (hash || type == OBJECT_TYPE || type == ARRAY_TYPE ? key : '') + ']';
        }

        // 递归
        if (!scope && array) {
            params.add(value.name, value.value);
        }
        // recurse into nested objects
        else if (type == ARRAY_TYPE || (!traditional && type == OBJECT_TYPE)) {
            serialize(params, value, traditional, key);
        } else {
            params.add(key, value);
        }
    });
};

/**
 * 功能和`Zepto.param`一样
 * @param obj {Object}
 * @param traditional {Boolean}
 * @returns {string}
 * $.param({ foo: { one: 1, two: 2 }}) // "foo[one]=1&foo[two]=2)"
 * $.param({ ids: [1,2,3] })           // "ids[]=1&ids[]=2&ids[]=3"
 * $.param({ ids: [1,2,3] }, true)     // "ids=1&ids=2&ids=3"
 * $.param({ foo: 'bar', nested: { will: 'not be ignored' }})    // "foo=bar&nested[will]=not+be+ignored"
 * $.param({ foo: 'bar', nested: { will: 'be ignored' }}, true)  // "foo=bar&nested=[object+Object]"
 * $.param({ id: function(){ return 1 + 2 } })  // "id=3"
 */
let param = (obj, traditional) => {
    var params = [];
    params.add = (key, value) => {
        if (isFunction(value)) value = value();
        if (value == NULL) value = '';
        params.push(escape(key) + '=' + escape(value));
    };
    serialize(params, obj, traditional);
    return params.join('&').replace(/%20/g, '+');
};

let decodeParam = (str) => {
    return decodeURIComponent(str.replace(/\+/g, ' '));
};

// 给URL追加查询字符串
let appendQueryString = (url, obj, cache, traditional) => {
    //let kv = [];

    // 是否追加noCache参数
    if (!cache) {
        obj.__noCache = makeRandom();
    }

    let queryString = param(obj, traditional);
    //!cache && kv.push('noCache=' + makeRandom());

    //for (let key in obj) {
    //    if (obj.hasOwnProperty(key)) {
    //        kv.push(escape(key) + '=' + escape(obj[key]));
    //    }
    //}

    if (queryString) {
        return url + (~url.indexOf('?') ? '&' : '?') + queryString;
    } else {
        return url;
    }
};

module.exports = {
    isIE,
    extend: redo(extend),
    each,
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
    param,
    decodeParam,
    runAsFn
};
