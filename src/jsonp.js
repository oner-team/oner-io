const {appendQueryString, noop, extend, makeRandom, loadScript} = require('./util');
const win = window;
const doc = document;
const random = Math.random;

let head = null;

let createScriptTag = function () {
    return doc.createElement('script');
}

let defaultOptions = {
    url: '',
    data: {},
    cache: true,
    success: noop,
    error: noop,
    complete: noop,
    log: false,
    callbackQuery: {
        callback: 'jsonp{id}'
    }
};

let jsonp = (options) => {
    options = extend({}, defaultOptions, options);

    let callbackName;
    for (let i in options.callbackQuery) {
        callbackName = options.callbackQuery[i] = options.callbackQuery[i].replace(/\{id\}/, makeRandom());
    }

    // 成功回调
    win[callbackName] = (data) => {
        win[callbackName] = null;
        options.success(data);
        options.complete();
    };

    // 加载脚本
    let url = appendQueryString(options.url, options.callbackQuery, true);
    let script = loadScript(url, (e) => {
        options.error(e);
        options.complete();
    });
}

module.exports = jsonp;