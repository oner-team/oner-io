/**
 * 对象扩展
 * @param  {Object} receiver
 * @param  {Object} supplier
 * @return {Object} 扩展后的receiver对象
 */
function extend(receiver = {}, supplier = {}) {
    for (let key in supplier) {
        if (supplier.hasOwnProperty(key) && supplier[key] !== undefined) {
            receiver[key] = supplier[key];
        }
    }
    return receiver;
}

/**
 * 变换两个参数的函数到多个参数
 * @param  {Function} fn 基函数
 * @return {Function} 变换后的函数
 * @demo
 *      function add(x, y) { return x+y; }
 *      add = redo(add);
 *      add(1,2,3) => 6
 */
function redo(fn) {
    return function () {
        var args = arguments;
        var ret = fn(args[0], args[1]);
        for (var i = 2, l = args.length; i < l; i++) {
            ret = fn(ret, args[i]);
        }
        return ret;
    }
}

// 给URL追加查询字符串
let escape = encodeURIComponent;
let appendQueryString = (url, obj, cache) => {
    let kv = [];

    // 是否追加noCache参数
    !cache && kv.push('noCache=' + Math.floor(Math.random() * 9e9));

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
}

const FUNCTION = 'function';
let runAsFn = (v) => {
    return typeof v === FUNCTION ? v() : v;
};

const absoluteUrlReg = /^(https?:)?\/\//;
let isAbsoluteUrl = (url) => {
    return !!url.match(absoluteUrlReg);
}

const BOOLEAN = 'boolean';
let isBoolean = (v) => {
    return typeof v === BOOLEAN;
}

module.exports = {
    extend: redo(extend),
    appendQueryString,
    noop: function (v) {return v;},
    runAsFn,
    isAbsoluteUrl,
    isBoolean
};