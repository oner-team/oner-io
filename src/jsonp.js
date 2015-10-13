const {appendQueryString, noop, extend, makeRandom} = require('./util');
const win = window;
const doc = document;
const random = Math.random;
const NULL = null;
const SCRIPT = 'script';

let removeScript = (script) => {
    script.onload = NULL;
    script.parentNode.removeChild(script);
    script = NULL;
};
let head = NULL;
let insertScript = (url, errorCB = noop, options = {}) => {
    let script = doc.createElement(SCRIPT);
    script.src = url;
    script.async = true;

    script.onerror = (e) => {
        errorCB(e);
    };

    // `onload`只做一件事 即删除`script`标签
    // 不兼容IE 不需要`onreadystatechange`
    script.onload = () => {
        options.log && console.log('jsonp onload');
        removeScript(script);
        script = NULL;
    };
    head = head || doc.getElementsByTagName('head')[0];
    head.insertBefore(script, head.firstChild);
    return script;
}

let defaultOptions = {
    url: '',
    data: {},
    cache: true,
    success: noop,
    error: noop,
    complete: noop,
    log: false,
    flag: 'callback',
    callbackName: 'jsonp{id}'
};

let jsonp = (options) => {
    options = extend({}, defaultOptions, options);

    let callbackName = options.callbackName.replace(/\{id\}/, makeRandom());

    // 成功回调
    win[callbackName] = (data) => {
        win[callbackName] = NULL;
        options.success(data);
        options.complete();
    };

    // 生成`url`
    let url = appendQueryString(options.url, {
        [options.flag]: callbackName
    }, true);

    // 插入脚本 + 错误回调
    let script = insertScript(url, (e) => {
        options.error(e);
        options.complete();
    }, options);
    
    return {
        abort() {
            options.log && console.log('jsonp abort');

            // 覆盖成功回调为无数据处理版本
            win[callbackName] = () => {
                win[callbackName] = NULL;
            };
            script.onload = NULL;
            removeScript(script);
            script = NULL;
        }
    };
}

module.exports = jsonp;