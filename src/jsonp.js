const {appendQueryString, noop, extend, makeRandom} = require('./util');
const hasWindow = 'undefined' !== typeof window;
const win = hasWindow ? window : null;
const doc = hasWindow ? document : null;
const NULL = null;
const SCRIPT = 'script';
const FALSE = false;

let removeScript = (script) => {
    script.onerror = NULL;
    script.parentNode.removeChild(script);
};
let head = NULL;
let insertScript = (url, options) => {
    let script = doc.createElement(SCRIPT);
    script.src = url;
    script.async = true;

    script.onerror = (e) => {
        win[options.callbackName] = NULL;
        options.error(e);
        options.complete();
    };

    head = head || doc.getElementsByTagName('head')[0];
    head.insertBefore(script, head.firstChild);
    return script;
}

let defaultOptions = {
    url: '',
    mark: {},
    data: {},
    success: noop,
    error: noop,
    complete: noop,
    log: false,
    flag: 'callback',
    callbackName: 'jsonp{id}',
    traditional: FALSE
};

let jsonp = (options) => {

    options = extend({}, defaultOptions, options);

    let callbackName = options.callbackName = options.callbackName.replace(/\{id\}/, makeRandom());

    let originComplete = options.complete;

    let script;

    // 二次包装的`complete`回调
    options.complete = () => {
        // 删除脚本
        removeScript(script);
        originComplete();
    }

    // 成功回调
    win[callbackName] = (data) => {
        win[callbackName] = NULL;
        options.success(data);
        options.complete();
    };

    // 生成`url`
    let url = appendQueryString(
        options.url,
        extend({[options.flag]: callbackName}, options.mark, options.data),
        options.traditional
    );

    // 插入脚本
    script = insertScript(url, options);
    
    return {
        abort() {
            // 覆盖成功回调为无数据处理版本
            win[callbackName] = () => {
                win[callbackName] = NULL;
            };
            removeScript(script);
        }
    };
}

module.exports = jsonp;
